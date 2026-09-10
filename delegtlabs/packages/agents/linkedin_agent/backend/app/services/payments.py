"""Razorpay one-time Orders for subscription plans and credit packs.

Checkout and webhooks both call fulfill_paid_row so a captured payment is
applied once even if verify and the webhook race.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import uuid
from datetime import date, datetime, timezone
from typing import Any, Optional

import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.core.database import execute_one_raw, execute_raw
from app.services.billing import (
    DEFAULT_AGENT_KIND,
    purchase_pack,
    select_plan,
    serialize_pack,
    serialize_plan,
)
from app.services.users import get_user_by_id

logger = logging.getLogger(__name__)

RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders"
KIND_SUBSCRIPTION = "subscription"
KIND_CREDIT_PACK = "credit_pack"
STATUS_CREATED = "created"
STATUS_ATTEMPTED = "attempted"
STATUS_PAID = "paid"
STATUS_FAILED = "failed"
STATUS_CANCELLED = "cancelled"
BUY_ROLES = {"owner", "admin"}

STATUS_LABELS = {
    STATUS_CREATED: "Pending",
    STATUS_ATTEMPTED: "Pending",
    STATUS_PAID: "Completed",
    STATUS_FAILED: "Failed",
    STATUS_CANCELLED: "Cancelled",
}


def _iso(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return value


def checkout_signature_valid(order_id: str, payment_id: str, signature: str, secret: str) -> bool:
    if not order_id or not payment_id or not signature or not secret:
        return False
    expected = hmac.new(
        secret.encode("utf-8"),
        f"{order_id}|{payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def webhook_signature_valid(body: bytes, signature: str, secret: str) -> bool:
    if not body or not signature or not secret:
        return False
    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def serialize_payment(row: dict) -> dict:
    status = str(row.get("status") or STATUS_CREATED)
    invoice_number = row.get("invoice_number")
    return {
        "id": str(row["id"]),
        "kind": row.get("kind"),
        "status": status,
        "status_label": STATUS_LABELS.get(status, status),
        "sku_code": row.get("sku_code"),
        "sku_name": row.get("sku_name"),
        "amount_inr_minor": int(row.get("amount_inr_minor") or 0),
        "currency": row.get("currency") or "INR",
        "invoice_number": invoice_number,
        "has_invoice": status == STATUS_PAID and bool(invoice_number),
        "razorpay_order_id": row.get("razorpay_order_id"),
        "razorpay_payment_id": row.get("razorpay_payment_id"),
        "failure_reason": row.get("failure_reason"),
        "fulfilled": bool(row.get("fulfilled")),
        "paid_at": _iso(row.get("paid_at")),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
        "buyer_email": row.get("buyer_email"),
        "buyer_name": row.get("buyer_name"),
        "tenant_name": row.get("tenant_name"),
    }


def public_config() -> dict:
    return {
        "configured": settings.razorpay_configured,
        "key_id": settings.RAZORPAY_KEY_ID if settings.razorpay_configured else None,
        "currency": "INR",
    }


def _invoice_number() -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"INV-{stamp}-{uuid.uuid4().hex[:8].upper()}"


def _receipt() -> str:
    return f"rcp_{uuid.uuid4().hex[:16]}"


def _as_uuid_or_none(value: Optional[str]) -> Optional[str]:
    raw = str(value or "").strip()
    if not raw:
        return None
    try:
        return str(uuid.UUID(raw))
    except (ValueError, TypeError, AttributeError):
        return None


async def _get_payment(payment_id: str) -> Optional[dict]:
    return await execute_one_raw(
        "SELECT * FROM billing_payments WHERE id = CAST(:id AS uuid)",
        {"id": payment_id},
    )


async def _get_by_order(order_id: str) -> Optional[dict]:
    return await execute_one_raw(
        "SELECT * FROM billing_payments WHERE razorpay_order_id = :oid",
        {"oid": order_id},
    )


async def _apply_entitlement(row: dict) -> None:
    tenant_id = str(row["tenant_id"])
    kind = row["kind"]
    actor_id = row.get("created_by")
    if kind == KIND_SUBSCRIPTION:
        await select_plan(
            tenant_id,
            str(row["plan_id"]),
            agent_kind=DEFAULT_AGENT_KIND,
            actor_id=actor_id,
            grant_credits=False,
        )
        return
    if kind == KIND_CREDIT_PACK:
        await purchase_pack(tenant_id, str(row["pack_id"]), actor_id=actor_id)
        return
    raise HTTPException(400, detail="Unknown payment kind")


async def fulfill_paid_row(
    payment_id: str,
    *,
    razorpay_payment_id: Optional[str] = None,
    razorpay_signature: Optional[str] = None,
) -> dict:
    """Mark paid + grant plan/credits once. Safe to call from verify and webhook."""
    row = await _get_payment(payment_id)
    if not row:
        raise HTTPException(404, detail="Payment not found")
    if row.get("status") == STATUS_CANCELLED:
        raise HTTPException(409, detail="Payment was cancelled")

    if not row.get("fulfilled"):
        claimed = await execute_one_raw(
            """
            UPDATE billing_payments
            SET status = :paid,
                fulfilled = true,
                invoice_number = COALESCE(invoice_number, :inv),
                razorpay_payment_id = COALESCE(:pid, razorpay_payment_id),
                razorpay_signature = COALESCE(:sig, razorpay_signature),
                paid_at = COALESCE(paid_at, NOW()),
                failure_reason = NULL,
                updated_at = NOW()
            WHERE id = CAST(:id AS uuid)
              AND fulfilled = false
              AND status <> :cancelled
            RETURNING *
            """,
            {
                "id": payment_id,
                "paid": STATUS_PAID,
                "cancelled": STATUS_CANCELLED,
                "inv": _invoice_number(),
                "pid": razorpay_payment_id,
                "sig": razorpay_signature,
            },
        )
        if claimed:
            try:
                await _apply_entitlement(claimed)
            except Exception:
                await execute_raw(
                    """
                    UPDATE billing_payments
                    SET fulfilled = false, updated_at = NOW()
                    WHERE id = CAST(:id AS uuid)
                    """,
                    {"id": payment_id},
                )
                logger.exception("Entitlement failed for payment %s", payment_id)
                raise
            return serialize_payment(claimed)

    latest = await _get_payment(payment_id)
    if not latest:
        raise HTTPException(404, detail="Payment not found")
    if latest.get("fulfilled") and latest.get("status") == STATUS_PAID:
        if razorpay_payment_id or razorpay_signature:
            latest = await execute_one_raw(
                """
                UPDATE billing_payments
                SET razorpay_payment_id = COALESCE(:pid, razorpay_payment_id),
                    razorpay_signature = COALESCE(:sig, razorpay_signature),
                    updated_at = NOW()
                WHERE id = CAST(:id AS uuid)
                RETURNING *
                """,
                {"id": payment_id, "pid": razorpay_payment_id, "sig": razorpay_signature},
            ) or latest
        return serialize_payment(latest)
    raise HTTPException(409, detail="Payment cannot be fulfilled")


async def _razorpay_create_order(amount: int, receipt: str, notes: dict) -> dict:
    if not settings.razorpay_configured:
        raise HTTPException(503, detail="Payments are not configured")
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                RAZORPAY_ORDERS_URL,
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
                json={
                    "amount": amount,
                    "currency": "INR",
                    "receipt": receipt,
                    "payment_capture": 1,
                    "notes": notes,
                },
            )
    except httpx.HTTPError as err:
        logger.error("Razorpay order request failed: %s", err)
        raise HTTPException(502, detail="Could not reach Razorpay") from err
    if response.status_code >= 400:
        logger.error("Razorpay order error %s: %s", response.status_code, response.text)
        raise HTTPException(502, detail="Razorpay rejected the order")
    data = response.json()
    if not data.get("id"):
        raise HTTPException(502, detail="Razorpay returned an empty order")
    return data


async def create_checkout_order(
    *,
    tenant_id: str,
    user_id: str,
    kind: str,
    plan_id: Optional[str] = None,
    pack_id: Optional[str] = None,
) -> dict:
    if kind not in (KIND_SUBSCRIPTION, KIND_CREDIT_PACK):
        raise HTTPException(400, detail="kind must be subscription or credit_pack")

    tenant = await execute_one_raw(
        "SELECT id, name FROM tenants WHERE id = CAST(:id AS uuid)",
        {"id": tenant_id},
    )
    if not tenant:
        raise HTTPException(404, detail="Workspace not found")
    user = None
    if _as_uuid_or_none(user_id):
        user = await get_user_by_id(user_id)
    buyer_email = (user or {}).get("email")
    buyer_name = (user or {}).get("full_name")

    plan_row = None
    pack_row = None
    plan_id = _as_uuid_or_none(plan_id)
    pack_id = _as_uuid_or_none(pack_id)
    if kind == KIND_SUBSCRIPTION:
        if not plan_id:
            raise HTTPException(400, detail="plan_id is required")
        plan_row = await execute_one_raw(
            "SELECT * FROM subscription_plans WHERE id = CAST(:id AS uuid) AND is_active",
            {"id": plan_id},
        )
        if not plan_row:
            raise HTTPException(404, detail="Plan not found")
        amount = int(plan_row["price_inr_minor"])
        sku_code = plan_row["code"]
        sku_name = plan_row["name"]
        pack_id = None
    else:
        if not pack_id:
            raise HTTPException(400, detail="pack_id is required")
        pack_row = await execute_one_raw(
            "SELECT * FROM credit_packs WHERE id = CAST(:id AS uuid) AND is_active",
            {"id": pack_id},
        )
        if not pack_row:
            raise HTTPException(404, detail="Credit pack not found")
        amount = int(pack_row["price_inr_minor"])
        sku_code = pack_row["code"]
        sku_name = pack_row["name"]
        plan_id = None

    if amount > 0 and not settings.razorpay_configured:
        raise HTTPException(503, detail="Payments are not configured")

    receipt = _receipt()
    inserted = await execute_one_raw(
        """
        INSERT INTO billing_payments (
          tenant_id, created_by, kind, plan_id, pack_id, sku_code, sku_name,
          amount_inr_minor, currency, status, receipt, buyer_email, buyer_name, tenant_name
        ) VALUES (
          CAST(:tid AS uuid), :uid, :kind,
          CAST(:plan AS uuid), CAST(:pack AS uuid),
          :sku_code, :sku_name, :amount, 'INR', :status, :receipt,
          :email, :bname, :tname
        )
        RETURNING *
        """,
        {
            "tid": tenant_id,
            "uid": user_id,
            "kind": kind,
            "plan": plan_id,
            "pack": pack_id,
            "sku_code": sku_code,
            "sku_name": sku_name,
            "amount": amount,
            "status": STATUS_CREATED,
            "receipt": receipt,
            "email": buyer_email,
            "bname": buyer_name,
            "tname": tenant.get("name"),
        },
    )
    if not inserted:
        raise HTTPException(500, detail="Could not create payment")

    payment_id = str(inserted["id"])
    if amount == 0:
        paid = await fulfill_paid_row(payment_id)
        return {
            "skip_checkout": True,
            "key_id": None,
            "amount_inr_minor": 0,
            "currency": "INR",
            "payment": paid,
            "prefill": {"email": buyer_email, "name": buyer_name},
            "plan": serialize_plan(plan_row) if plan_row else None,
            "pack": serialize_pack(pack_row) if pack_row else None,
        }

    notes = {
        "tenant_id": tenant_id,
        "kind": kind,
        "payment_id": payment_id,
    }
    try:
        order = await _razorpay_create_order(amount, receipt, notes)
    except HTTPException:
        await execute_raw(
            """
            UPDATE billing_payments
            SET status = :st, failure_reason = :reason, updated_at = NOW()
            WHERE id = CAST(:id AS uuid)
            """,
            {"id": payment_id, "st": STATUS_FAILED, "reason": "Razorpay order create failed"},
        )
        raise

    updated = await execute_one_raw(
        """
        UPDATE billing_payments
        SET razorpay_order_id = :oid, status = :st, updated_at = NOW()
        WHERE id = CAST(:id AS uuid)
        RETURNING *
        """,
        {"id": payment_id, "oid": order["id"], "st": STATUS_ATTEMPTED},
    )
    payment = serialize_payment(updated or inserted)
    return {
        "skip_checkout": False,
        "key_id": settings.RAZORPAY_KEY_ID,
        "razorpay_order_id": order["id"],
        "amount_inr_minor": amount,
        "currency": "INR",
        "payment": payment,
        "prefill": {"email": buyer_email, "name": buyer_name},
        "plan": serialize_plan(plan_row) if plan_row else None,
        "pack": serialize_pack(pack_row) if pack_row else None,
    }


async def confirm_checkout(
    *,
    tenant_id: str,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> dict:
    if not settings.razorpay_configured:
        raise HTTPException(503, detail="Payments are not configured")
    if not checkout_signature_valid(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        settings.RAZORPAY_KEY_SECRET,
    ):
        raise HTTPException(400, detail="Invalid payment signature")

    row = await _get_by_order(razorpay_order_id)
    if not row or str(row["tenant_id"]) != tenant_id:
        raise HTTPException(404, detail="Payment not found")
    paid = await fulfill_paid_row(
        str(row["id"]),
        razorpay_payment_id=razorpay_payment_id,
        razorpay_signature=razorpay_signature,
    )
    return {"ok": True, "payment": paid}


async def cancel_checkout(*, tenant_id: str, payment_id: str) -> dict:
    row = await execute_one_raw(
        """
        UPDATE billing_payments
        SET status = :st, updated_at = NOW()
        WHERE id = CAST(:id AS uuid)
          AND tenant_id = CAST(:tid AS uuid)
          AND status IN (:created, :attempted)
          AND fulfilled = false
        RETURNING *
        """,
        {
            "id": payment_id,
            "tid": tenant_id,
            "st": STATUS_CANCELLED,
            "created": STATUS_CREATED,
            "attempted": STATUS_ATTEMPTED,
        },
    )
    if not row:
        existing = await execute_one_raw(
            """
            SELECT * FROM billing_payments
            WHERE id = CAST(:id AS uuid) AND tenant_id = CAST(:tid AS uuid)
            """,
            {"id": payment_id, "tid": tenant_id},
        )
        if not existing:
            raise HTTPException(404, detail="Payment not found")
        return serialize_payment(existing)
    return serialize_payment(row)


async def mark_payment_failed(order_id: str, reason: Optional[str] = None) -> Optional[dict]:
    row = await execute_one_raw(
        """
        UPDATE billing_payments
        SET status = :st, failure_reason = :reason, updated_at = NOW()
        WHERE razorpay_order_id = :oid
          AND fulfilled = false
          AND status NOT IN (:paid, :cancelled)
        RETURNING *
        """,
        {
            "oid": order_id,
            "st": STATUS_FAILED,
            "reason": (reason or "Payment failed")[:500],
            "paid": STATUS_PAID,
            "cancelled": STATUS_CANCELLED,
        },
    )
    return serialize_payment(row) if row else None


async def list_payments(*, tenant_id: str, status: Optional[str] = None) -> list[dict]:
    wanted = (status or "all").lower()
    if wanted in ("completed", "paid"):
        wanted = STATUS_PAID
    elif wanted == "pending":
        rows = await execute_raw(
            """
            SELECT * FROM billing_payments
            WHERE tenant_id = CAST(:tid AS uuid)
              AND status IN (:a, :b)
            ORDER BY created_at DESC
            LIMIT 100
            """,
            {"tid": tenant_id, "a": STATUS_CREATED, "b": STATUS_ATTEMPTED},
        )
        return [serialize_payment(r) for r in rows]
    if wanted == "all":
        rows = await execute_raw(
            """
            SELECT * FROM billing_payments
            WHERE tenant_id = CAST(:tid AS uuid)
            ORDER BY created_at DESC
            LIMIT 100
            """,
            {"tid": tenant_id},
        )
        return [serialize_payment(r) for r in rows]
    if wanted not in (STATUS_PAID, STATUS_FAILED, STATUS_CANCELLED, STATUS_CREATED, STATUS_ATTEMPTED):
        raise HTTPException(400, detail="Unknown status filter")
    rows = await execute_raw(
        """
        SELECT * FROM billing_payments
        WHERE tenant_id = CAST(:tid AS uuid) AND status = :st
        ORDER BY created_at DESC
        LIMIT 100
        """,
        {"tid": tenant_id, "st": wanted},
    )
    return [serialize_payment(r) for r in rows]


async def get_invoice(*, tenant_id: str, payment_id: str) -> dict:
    row = await execute_one_raw(
        """
        SELECT * FROM billing_payments
        WHERE id = CAST(:id AS uuid) AND tenant_id = CAST(:tid AS uuid)
        """,
        {"id": payment_id, "tid": tenant_id},
    )
    if not row:
        raise HTTPException(404, detail="Payment not found")
    if row.get("status") != STATUS_PAID:
        raise HTTPException(409, detail="Invoice is available after the payment completes")
    payload = serialize_payment(row)
    payload["invoice"] = {
        "number": row.get("invoice_number"),
        "issued_at": _iso(row.get("paid_at") or row.get("created_at")),
        "seller": "AntGrav",
        "buyer_name": row.get("buyer_name") or row.get("tenant_name") or "Customer",
        "buyer_email": row.get("buyer_email"),
        "workspace": row.get("tenant_name"),
        "description": row.get("sku_name"),
        "kind": row.get("kind"),
        "amount_inr_minor": int(row.get("amount_inr_minor") or 0),
        "currency": "INR",
        "payment_reference": row.get("razorpay_payment_id"),
    }
    return payload


async def handle_webhook(body: bytes, signature: str) -> dict:
    secret = settings.RAZORPAY_WEBHOOK_SECRET or settings.RAZORPAY_KEY_SECRET
    if not secret:
        raise HTTPException(503, detail="Payments are not configured")
    if not webhook_signature_valid(body, signature, secret):
        raise HTTPException(400, detail="Invalid webhook signature")
    try:
        payload = json.loads(body.decode("utf-8") or "{}")
    except (ValueError, UnicodeDecodeError) as err:
        raise HTTPException(400, detail="Invalid webhook body") from err

    event = str(payload.get("event") or "")
    entity = ((payload.get("payload") or {}).get("payment") or {}).get("entity") or {}
    order_id = entity.get("order_id")
    payment_id = entity.get("id")
    if event in ("payment.captured", "order.paid"):
        if not order_id:
            return {"ok": True, "ignored": True}
        row = await _get_by_order(str(order_id))
        if not row:
            logger.warning("Webhook %s for unknown order %s", event, order_id)
            return {"ok": True, "ignored": True}
        paid = await fulfill_paid_row(
            str(row["id"]),
            razorpay_payment_id=str(payment_id) if payment_id else None,
        )
        return {"ok": True, "payment": paid}
    if event == "payment.failed":
        if order_id:
            await mark_payment_failed(
                str(order_id),
                entity.get("error_description") or entity.get("error_reason"),
            )
        return {"ok": True}
    return {"ok": True, "ignored": True}
