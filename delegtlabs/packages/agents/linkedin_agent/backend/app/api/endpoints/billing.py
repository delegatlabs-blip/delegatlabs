"""Tenant billing: Razorpay checkout, quota snapshot, invoices, webhooks."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.auth_context import AuthContext, get_auth_context
from app.services import payments as payment_svc
from app.services.quota import quota_snapshot

router = APIRouter(tags=["billing"])


def _require_buyer(ctx: AuthContext) -> None:
    ctx.require_tenant_roles(payment_svc.BUY_ROLES)


@router.get("/tenant/billing/config")
async def billing_config(ctx: AuthContext = Depends(get_auth_context)):
    return payment_svc.public_config()


@router.get("/tenant/billing/quota")
async def billing_quota(ctx: AuthContext = Depends(get_auth_context)):
    return await quota_snapshot(ctx.tenant_id)


@router.get("/tenant/billing/payments")
async def billing_payments(
    status: str = "all",
    ctx: AuthContext = Depends(get_auth_context),
):
    return {"payments": await payment_svc.list_payments(tenant_id=ctx.tenant_id, status=status)}


@router.get("/tenant/billing/payments/{payment_id}")
async def billing_payment_detail(payment_id: str, ctx: AuthContext = Depends(get_auth_context)):
    return await payment_svc.get_invoice(tenant_id=ctx.tenant_id, payment_id=payment_id)


@router.post("/tenant/billing/orders")
async def create_billing_order(request: Request, ctx: AuthContext = Depends(get_auth_context)):
    _require_buyer(ctx)
    body = await request.json()
    return await payment_svc.create_checkout_order(
        tenant_id=ctx.tenant_id,
        user_id=ctx.user_id,
        kind=str(body.get("kind") or ""),
        plan_id=body.get("plan_id"),
        pack_id=body.get("pack_id"),
    )


@router.post("/tenant/billing/verify")
async def verify_billing_payment(request: Request, ctx: AuthContext = Depends(get_auth_context)):
    _require_buyer(ctx)
    body = await request.json()
    return await payment_svc.confirm_checkout(
        tenant_id=ctx.tenant_id,
        razorpay_order_id=str(body.get("razorpay_order_id") or ""),
        razorpay_payment_id=str(body.get("razorpay_payment_id") or ""),
        razorpay_signature=str(body.get("razorpay_signature") or ""),
    )


@router.post("/tenant/billing/orders/{payment_id}/cancel")
async def cancel_billing_order(payment_id: str, ctx: AuthContext = Depends(get_auth_context)):
    _require_buyer(ctx)
    return await payment_svc.cancel_checkout(tenant_id=ctx.tenant_id, payment_id=payment_id)


@router.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request):
    signature = request.headers.get("X-Razorpay-Signature") or ""
    body = await request.body()
    if not signature:
        raise HTTPException(400, detail="Missing webhook signature")
    return await payment_svc.handle_webhook(body, signature)
