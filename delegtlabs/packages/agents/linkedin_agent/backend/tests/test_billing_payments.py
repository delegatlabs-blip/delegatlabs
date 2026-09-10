"""Razorpay billing + quota snapshot tests."""
from __future__ import annotations

import hashlib
import hmac
import json
from datetime import date
from unittest.mock import patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.services.payments import checkout_signature_valid, webhook_signature_valid
from tests.ts8_helpers import (
    TENANT_ID,
    _install_store,
    _make_app,
    client_as,
    close_client,
    pack_row,
    plan_row,
    tenant_ctx,
    CatalogStore,
)
from tests.ts16_helpers import HOUR, install_quota_store
from tests.ts16_store import QuotaStore


class BillingStore(CatalogStore):
    def __init__(self) -> None:
        super().__init__()
        self.payments: dict[str, dict] = {}
        self.subs: list[dict] = []
        self.tenants = {
            TENANT_ID: {
                "id": TENANT_ID,
                "name": "Acme",
                "credits_remaining": 10,
            }
        }
        self.ledger: list[dict] = []

    def exec(self, sql: str, params=None):
        params = dict(params or {})
        s = " ".join(sql.split()).lower()
        if "billing_payments" in s:
            return self._payments(s, params)
        if "agent_subscriptions" in s:
            return self._subs(s, params)
        if "credit_transactions" in s:
            row = {"id": str(uuid4()), "amount": params.get("amt", 0), "reason": params.get("reason")}
            self.ledger.append(row)
            return [row]
        if "credit_usage_daily" in s:
            return []
        if "from tenants" in s or "update tenants" in s:
            return self._tenants(s, params)
        if "from users" in s:
            return []
        return super().exec(sql, params)

    def _tenants(self, s: str, params: dict) -> list[dict]:
        tid = str(params.get("id") or params.get("tid") or TENANT_ID)
        row = self.tenants.get(tid)
        if not row:
            return []
        if "credits_remaining =" in s and "update" in s:
            if "+ :amt" in s or "credits_remaining + :amt" in s.replace(" ", ""):
                row["credits_remaining"] = int(row["credits_remaining"]) + int(params.get("amt") or 0)
            elif "- :amt" in s:
                amt = int(params.get("amt") or 0)
                if int(row["credits_remaining"]) < amt:
                    return []
                row["credits_remaining"] = int(row["credits_remaining"]) - amt
            return [dict(row)]
        return [dict(row)]

    def _subs(self, s: str, params: dict) -> list[dict]:
        tid = str(params.get("tid") or "")
        kind = params.get("k") or params.get("kind") or "post_gen"
        if "insert" in s:
            existing = next(
                (r for r in self.subs if r["tenant_id"] == tid and r["agent_kind"] == kind),
                None,
            )
            payload = {
                "id": existing["id"] if existing else str(uuid4()),
                "tenant_id": tid,
                "agent_kind": kind,
                "tier": params.get("tier"),
                "status": "active",
                "plan_id": params.get("pid") or params.get("plan_id"),
            }
            if existing:
                existing.update(payload)
                return [dict(existing)]
            self.subs.append(payload)
            return [dict(payload)]
        rows = [dict(r) for r in self.subs]
        if tid:
            rows = [r for r in rows if r["tenant_id"] == tid]
        return rows

    def _payments(self, s: str, params: dict) -> list[dict]:
        if "insert into billing_payments" in s:
            row = {
                "id": str(uuid4()),
                "tenant_id": params.get("tid"),
                "created_by": params.get("uid"),
                "kind": params.get("kind"),
                "plan_id": params.get("plan"),
                "pack_id": params.get("pack"),
                "sku_code": params.get("sku_code"),
                "sku_name": params.get("sku_name"),
                "amount_inr_minor": int(params.get("amount") or 0),
                "currency": "INR",
                "status": params.get("status") or "created",
                "fulfilled": False,
                "razorpay_order_id": None,
                "razorpay_payment_id": None,
                "razorpay_signature": None,
                "receipt": params.get("receipt"),
                "invoice_number": None,
                "failure_reason": None,
                "buyer_email": params.get("email"),
                "buyer_name": params.get("bname"),
                "tenant_name": params.get("tname"),
                "paid_at": None,
                "created_at": "2026-09-06T00:00:00+00:00",
                "updated_at": "2026-09-06T00:00:00+00:00",
            }
            self.payments[row["id"]] = row
            return [dict(row)]

        row = None
        pid = params.get("id")
        if pid and str(pid) in self.payments:
            row = self.payments[str(pid)]
        elif params.get("oid"):
            row = next(
                (p for p in self.payments.values() if p.get("razorpay_order_id") == params["oid"]),
                None,
            )
        elif params.get("tid") and "order by created_at" in s:
            rows = [dict(p) for p in self.payments.values() if p.get("tenant_id") == params.get("tid")]
            st = params.get("st") or params.get("status")
            if "status in (:a, :b)" in s:
                rows = [r for r in rows if r.get("status") in (params.get("a"), params.get("b"))]
            elif st:
                rows = [r for r in rows if r.get("status") == st]
            return rows

        if row is None:
            if params.get("tid"):
                return [
                    dict(p)
                    for p in self.payments.values()
                    if p.get("tenant_id") == params.get("tid")
                    and (not pid or str(p["id"]) == str(pid))
                ]
            return []

        if "update billing_payments" in s:
            if "fulfilled = false" in s and row.get("fulfilled"):
                return []
            if "status <> :cancelled" in s and row.get("status") == "cancelled":
                return []
            if "status in (:created, :attempted)" in s and row.get("status") not in (
                params.get("created"),
                params.get("attempted"),
            ):
                return []
            if "status not in (:paid, :cancelled)" in s and row.get("status") in (
                params.get("paid"),
                params.get("cancelled"),
            ):
                return []
            mapping = {
                "st": "status",
                "oid": "razorpay_order_id",
                "pid": "razorpay_payment_id",
                "sig": "razorpay_signature",
                "inv": "invoice_number",
                "reason": "failure_reason",
                "paid": "status",
            }
            if params.get("st"):
                row["status"] = params["st"]
            if params.get("paid") and "status = :paid" in s:
                row["status"] = params["paid"]
            if params.get("oid"):
                row["razorpay_order_id"] = params["oid"]
            if params.get("pid"):
                row["razorpay_payment_id"] = params["pid"]
            if params.get("sig"):
                row["razorpay_signature"] = params["sig"]
            if params.get("inv") and not row.get("invoice_number"):
                row["invoice_number"] = params["inv"]
            if params.get("reason") is not None and "failure_reason" in s:
                row["failure_reason"] = params["reason"]
            if "fulfilled = true" in s:
                row["fulfilled"] = True
            if "fulfilled = false" in s and "set" in s and "fulfilled = true" not in s:
                row["fulfilled"] = False
            if row.get("status") == "paid":
                row["paid_at"] = row.get("paid_at") or "2026-09-06T01:00:00+00:00"
            return [dict(row)]
        return [dict(row)]


@pytest.fixture
def billing_store():
    store = BillingStore()
    patches = _install_store(store)
    yield store
    for p in patches:
        p.stop()


@pytest.fixture
def billing_client(billing_store):
    client = client_as(_make_app(), tenant_ctx())
    yield client
    close_client(client)


def test_checkout_signature_roundtrip():
    secret = "test_secret"
    order_id = "order_abc"
    payment_id = "pay_def"
    sig = hmac.new(
        secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256
    ).hexdigest()
    assert checkout_signature_valid(order_id, payment_id, sig, secret)
    assert not checkout_signature_valid(order_id, payment_id, "nope", secret)


def test_webhook_signature_roundtrip():
    secret = "hook_secret"
    body = b'{"event":"payment.captured"}'
    sig = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    assert webhook_signature_valid(body, sig, secret)
    assert not webhook_signature_valid(body, "nope", secret)


def test_billing_config_unconfigured(billing_client: TestClient):
    res = billing_client.get("/tenant/billing/config")
    assert res.status_code == 200
    body = res.json()
    assert body["configured"] is False
    assert body["key_id"] is None
    assert body["currency"] == "INR"


def test_verify_rejects_bad_signature(billing_client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "RAZORPAY_KEY_ID", "rzp_test")
    monkeypatch.setattr(settings, "RAZORPAY_KEY_SECRET", "supersecret")
    res = billing_client.post(
        "/tenant/billing/verify",
        json={
            "razorpay_order_id": "order_x",
            "razorpay_payment_id": "pay_x",
            "razorpay_signature": "deadbeef",
        },
    )
    assert res.status_code == 400


def test_create_order_requires_razorpay_for_paid_plan(billing_store, billing_client: TestClient):
    plan = billing_store.add_plan(plan_row(price_inr_minor=49900, is_active=True))
    res = billing_client.post(
        "/tenant/billing/orders",
        json={"kind": "subscription", "plan_id": plan["id"]},
    )
    assert res.status_code == 503


def test_free_plan_skips_checkout_and_assigns(billing_store, billing_client: TestClient):
    plan = billing_store.add_plan(plan_row(price_inr_minor=0, is_active=True, code="free", name="Free"))
    res = billing_client.post(
        "/tenant/billing/orders",
        json={"kind": "subscription", "plan_id": plan["id"]},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["skip_checkout"] is True
    assert body["payment"]["status"] == "paid"
    assert body["payment"]["has_invoice"] is True
    assert billing_store.subs
    assert str(billing_store.subs[0]["plan_id"]) == str(plan["id"])


def test_paid_plan_creates_razorpay_order(billing_store, billing_client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "RAZORPAY_KEY_ID", "rzp_test_key")
    monkeypatch.setattr(settings, "RAZORPAY_KEY_SECRET", "rzp_test_secret")
    plan = billing_store.add_plan(plan_row(price_inr_minor=49900, is_active=True, name="Starter"))

    async def fake_order(amount, receipt, notes):
        assert amount == 49900
        assert notes["kind"] == "subscription"
        return {"id": "order_test_1"}

    with patch("app.services.payments._razorpay_create_order", fake_order):
        res = billing_client.post(
            "/tenant/billing/orders",
            json={"kind": "subscription", "plan_id": plan["id"]},
        )
    assert res.status_code == 200
    body = res.json()
    assert body["skip_checkout"] is False
    assert body["razorpay_order_id"] == "order_test_1"
    assert body["key_id"] == "rzp_test_key"
    payment = next(iter(billing_store.payments.values()))
    assert payment["razorpay_order_id"] == "order_test_1"
    assert payment["status"] == "attempted"


def test_verify_and_list_and_invoice(billing_store, billing_client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "RAZORPAY_KEY_ID", "rzp_test_key")
    monkeypatch.setattr(settings, "RAZORPAY_KEY_SECRET", "rzp_test_secret")
    plan = billing_store.add_plan(plan_row(price_inr_minor=49900, is_active=True, name="Starter"))

    async def fake_order(amount, receipt, notes):
        return {"id": "order_pay_1"}

    with patch("app.services.payments._razorpay_create_order", fake_order):
        created = billing_client.post(
            "/tenant/billing/orders",
            json={"kind": "subscription", "plan_id": plan["id"]},
        ).json()

    sig = hmac.new(
        b"rzp_test_secret",
        b"order_pay_1|pay_live_1",
        hashlib.sha256,
    ).hexdigest()
    verified = billing_client.post(
        "/tenant/billing/verify",
        json={
            "razorpay_order_id": "order_pay_1",
            "razorpay_payment_id": "pay_live_1",
            "razorpay_signature": sig,
        },
    )
    assert verified.status_code == 200
    payment = verified.json()["payment"]
    assert payment["status"] == "paid"
    listed = billing_client.get("/tenant/billing/payments", params={"status": "completed"})
    assert listed.status_code == 200
    assert len(listed.json()["payments"]) == 1
    invoice = billing_client.get(f"/tenant/billing/payments/{created['payment']['id']}")
    assert invoice.status_code == 200
    assert invoice.json()["invoice"]["number"] == payment["invoice_number"]

    again = billing_client.post(
        "/tenant/billing/verify",
        json={
            "razorpay_order_id": "order_pay_1",
            "razorpay_payment_id": "pay_live_1",
            "razorpay_signature": sig,
        },
    )
    assert again.status_code == 200
    assert len(billing_store.subs) == 1


def test_credit_pack_purchase(billing_store, billing_client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "RAZORPAY_KEY_ID", "rzp_test_key")
    monkeypatch.setattr(settings, "RAZORPAY_KEY_SECRET", "rzp_test_secret")
    pack = billing_store.add_pack(pack_row(price_inr_minor=10000, credits=200, bonus_credits=0))

    async def fake_order(amount, receipt, notes):
        return {"id": "order_pack_1"}

    with patch("app.services.payments._razorpay_create_order", fake_order):
        billing_client.post(
            "/tenant/billing/orders",
            json={"kind": "credit_pack", "pack_id": pack["id"]},
        )
    sig = hmac.new(b"rzp_test_secret", b"order_pack_1|pay_pack_1", hashlib.sha256).hexdigest()
    res = billing_client.post(
        "/tenant/billing/verify",
        json={
            "razorpay_order_id": "order_pack_1",
            "razorpay_payment_id": "pay_pack_1",
            "razorpay_signature": sig,
        },
    )
    assert res.status_code == 200
    assert billing_store.tenants[TENANT_ID]["credits_remaining"] == 210


def test_webhook_marks_failed(billing_store, billing_client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "RAZORPAY_KEY_ID", "rzp_test_key")
    monkeypatch.setattr(settings, "RAZORPAY_KEY_SECRET", "rzp_test_secret")
    monkeypatch.setattr(settings, "RAZORPAY_WEBHOOK_SECRET", "hook_secret")
    plan = billing_store.add_plan(plan_row(price_inr_minor=49900, is_active=True))

    async def fake_order(amount, receipt, notes):
        return {"id": "order_fail_1"}

    with patch("app.services.payments._razorpay_create_order", fake_order):
        billing_client.post(
            "/tenant/billing/orders",
            json={"kind": "subscription", "plan_id": plan["id"]},
        )
    body = json.dumps(
        {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_fail",
                        "order_id": "order_fail_1",
                        "error_description": "Card declined",
                    }
                }
            },
        }
    ).encode()
    sig = hmac.new(b"hook_secret", body, hashlib.sha256).hexdigest()
    res = billing_client.post("/webhooks/razorpay", content=body, headers={"X-Razorpay-Signature": sig})
    assert res.status_code == 200
    payment = next(iter(billing_store.payments.values()))
    assert payment["status"] == "failed"
    listed = billing_client.get("/tenant/billing/payments", params={"status": "failed"})
    assert listed.json()["payments"][0]["status"] == "failed"


@pytest.mark.asyncio
async def test_quota_snapshot_remaining_and_skip(quota_store: QuotaStore):
    from app.services import quota as quota_mod

    quota_store.seed_tenant(TENANT_ID, "starter")
    quota_store.set_usage(TENANT_ID, "daily_text", HOUR.date(), 1)
    quota_store.set_usage(TENANT_ID, "weekly_image", date(2026, 9, 7), 0)
    patches = install_quota_store(quota_store, extra=[quota_mod])
    try:
        snap = await quota_mod.quota_snapshot(TENANT_ID, now_utc=HOUR)
    finally:
        for p in patches:
            p.stop()
    by_slot = {s["slot"]: s for s in snap["slots"]}
    assert by_slot["daily_text"]["cap"] == 1
    assert by_slot["daily_text"]["remaining"] == 0
    assert by_slot["weekly_image"]["remaining"] == 3
    assert snap["has_remaining"] is True
    assert snap["cron_would_skip"] is False

    quota_store.set_usage(TENANT_ID, "weekly_image", date(2026, 9, 7), 3)
    patches = install_quota_store(quota_store, extra=[quota_mod])
    try:
        empty = await quota_mod.quota_snapshot(TENANT_ID, now_utc=HOUR)
    finally:
        for p in patches:
            p.stop()
    assert empty["has_remaining"] is False
    assert empty["cron_would_skip"] is True
