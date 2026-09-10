"""Platform admin APIs: tenants, compliance, approvals, billing, staff, audit."""
from __future__ import annotations

import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.api.auth_context import AuthContext, get_auth_context
from app.core.database import execute_raw, execute_one_raw
from app.api.endpoints.topics import list_catalog_topics, update_topic_for_tenant
from app.schemas.topic import TopicUpdateRequest
from app.services.adaptive_onboarding.engine import AdaptiveOnboardingEngine
from app.services.adaptive_onboarding.persistence import delete_state, save_state
from app.services.audit import write_audit_log, DEFAULT_TENANT_ID
from app.services.billing import (
    admin_assign_plan,
    create_action_cost,
    create_pack,
    create_plan,
    list_action_costs,
    list_packs,
    list_plans,
    lookup_catalog_row,
    serialize_action_cost,
    serialize_pack,
    serialize_plan,
    update_action_cost,
    update_pack,
    update_plan,
)

_reset_engine = AdaptiveOnboardingEngine()

router = APIRouter(prefix="/admin", tags=["admin"])


def _staff(ctx: AuthContext, roles: Optional[set] = None) -> AuthContext:
    ctx.require_staff(roles)
    return ctx


# ---------- Users ----------
@router.get("/users")
async def list_users(
    q: Optional[str] = None,
    ctx: AuthContext = Depends(get_auth_context),
):
    """Platform view of people and the workspaces that carry their billing state."""
    _staff(ctx)
    users = await execute_raw(
        """
        SELECT u.id, u.email, u.full_name, u.avatar_url, u.status,
               u.email_verified_at, u.last_login_at, u.created_at,
               COALESCE(
                 json_agg(DISTINCT ai.provider::text)
                   FILTER (WHERE ai.provider IS NOT NULL),
                 '[]'::json
               ) AS providers,
               COALESCE(
                 json_agg(DISTINCT jsonb_build_object(
                   'tenant_id', tm.tenant_id,
                   'name', t.name,
                   'role', tm.role,
                   'credits_remaining', t.credits_remaining
                 )) FILTER (WHERE tm.tenant_id IS NOT NULL),
                 '[]'::json
               ) AS workspaces
        FROM users u
        LEFT JOIN auth_identities ai ON ai.user_id = u.id
        LEFT JOIN tenant_members tm ON tm.user_id = u.id::text
        LEFT JOIN tenants t ON t.id = tm.tenant_id
        WHERE CAST(:q AS text) IS NULL
           OR u.email ILIKE '%' || CAST(:q AS text) || '%'
           OR u.full_name ILIKE '%' || CAST(:q AS text) || '%'
        GROUP BY u.id
        ORDER BY u.created_at DESC
        """,
        {"q": q},
    )
    for user in users:
        for key in ("providers", "workspaces"):
            if isinstance(user.get(key), str):
                user[key] = json.loads(user[key])
    return {"users": users}


@router.patch("/users/{user_id}")
async def update_user_status(
    user_id: str,
    request: Request,
    ctx: AuthContext = Depends(get_auth_context),
):
    _staff(ctx, {"tech", "support"})
    status = (await request.json()).get("status")
    if status not in {"active", "suspended"}:
        raise HTTPException(400, detail="status must be active or suspended")
    before = await execute_one_raw(
        "SELECT id, email, full_name, avatar_url, status FROM users WHERE id::text = :id",
        {"id": user_id},
    )
    if not before:
        raise HTTPException(404, detail="User not found")
    user = await execute_one_raw(
        """
        UPDATE users SET status = CAST(:status AS user_status), updated_at = NOW()
        WHERE id::text = :id
        RETURNING id, email, full_name, avatar_url, status, updated_at
        """,
        {"id": user_id, "status": status},
    )
    if status == "suspended":
        await execute_raw(
            "UPDATE user_sessions SET revoked_at = NOW() WHERE user_id::text = :id AND revoked_at IS NULL",
            {"id": user_id},
        )
    await write_audit_log(
        actor_id=ctx.user_id,
        action="user.status.update",
        resource_type="user",
        resource_id=user_id,
        before_state=dict(before),
        after_state=dict(user),
    )
    return user


# ---------- Tenants ----------
@router.get("/tenants")
async def list_tenants(
    q: Optional[str] = None,
    industry: Optional[str] = None,
    status: Optional[str] = None,
    ctx: AuthContext = Depends(get_auth_context),
):
    _staff(ctx)
    if ctx.staff_role == "support":
        # support: read tenants + usage, not billing deep-dive — still list ok
        pass
    sql = """
    SELECT t.*,
      COALESCE((
        SELECT json_agg(json_build_object('agent_kind', a.agent_kind, 'tier', a.tier, 'status', a.status))
        FROM agent_subscriptions a WHERE a.tenant_id = t.id
      ), '[]'::json) AS agents
    FROM tenants t
    WHERE (CAST(:q AS text) IS NULL OR t.name ILIKE '%' || CAST(:q AS text) || '%')
      AND (CAST(:industry AS text) IS NULL OR t.industry = CAST(:industry AS text))
      AND (CAST(:status AS text) IS NULL OR t.subscription_status::text = CAST(:status AS text))
    ORDER BY t.name
    """
    tenants = await execute_raw(sql, {"q": q, "industry": industry, "status": status})
    for t in tenants:
        agents = t.get("agents")
        if isinstance(agents, str):
            t["agents"] = json.loads(agents)
        elif agents is None:
            t["agents"] = []
    return {"tenants": tenants}


@router.get("/tenants/{tenant_id}")
async def tenant_detail(tenant_id: str, ctx: AuthContext = Depends(get_auth_context)):
    _staff(ctx)
    tenant = await execute_one_raw("SELECT * FROM tenants WHERE id = :id", {"id": tenant_id})
    if not tenant:
        raise HTTPException(404, detail="Tenant not found")
    agents = await execute_raw(
        "SELECT * FROM agent_subscriptions WHERE tenant_id = :id ORDER BY agent_kind",
        {"id": tenant_id},
    )
    members = await execute_raw(
        "SELECT id, user_id, email, display_name, role, created_at FROM tenant_members WHERE tenant_id = :id",
        {"id": tenant_id},
    )
    # Support cannot see LinkedIn token metadata — strip if support
    connections = await execute_raw(
        """SELECT id, surface, display_name, token_expires_at, health, updated_at,
                  CASE WHEN :show_meta THEN metadata ELSE '{}'::jsonb END AS metadata
           FROM linkedin_connections WHERE tenant_id = :id""",
        {"id": tenant_id, "show_meta": ctx.staff_role != "support"},
    )
    onboarding = await execute_raw(
        "SELECT question_id, value, updated_at FROM onboarding_answers WHERE tenant_id = :id ORDER BY question_id",
        {"id": tenant_id},
    )
    configs = await execute_raw(
        """SELECT DISTINCT ON (agent_kind) id, agent_kind, version, config, created_by, created_at
           FROM agent_configs WHERE tenant_id = :id
           ORDER BY agent_kind, version DESC""",
        {"id": tenant_id},
    )
    return {
        "tenant": tenant,
        "agents": agents,
        "members": members,
        "connections": connections,
        "onboarding": onboarding,
        "configs": configs,
    }


@router.patch("/tenants/{tenant_id}/subscriptions/{agent_kind}")
async def update_subscription(
    tenant_id: str,
    agent_kind: str,
    request: Request,
    ctx: AuthContext = Depends(get_auth_context),
):
    _staff(ctx, {"tech", "finance"})
    body = await request.json()
    before = await execute_one_raw(
        "SELECT * FROM agent_subscriptions WHERE tenant_id = :tid AND agent_kind = :k",
        {"tid": tenant_id, "k": agent_kind},
    )
    tier = body.get("tier")
    status = body.get("status")
    row = await execute_one_raw(
        """
        UPDATE agent_subscriptions
        SET tier = COALESCE(CAST(:tier AS subscription_tier), tier),
            status = COALESCE(CAST(:status AS subscription_status), status),
            updated_at = NOW()
        WHERE tenant_id = :tid AND agent_kind = :k
        RETURNING *
        """,
        {"tid": tenant_id, "k": agent_kind, "tier": tier, "status": status},
    )
    if not row:
        raise HTTPException(404, detail="Subscription not found")
    await write_audit_log(
        actor_id=ctx.user_id,
        action="subscription.update",
        resource_type="agent_subscription",
        resource_id=str(row["id"]),
        tenant_id=tenant_id,
        before_state=dict(before) if before else None,
        after_state=dict(row),
    )
    return row


@router.post("/tenants/{tenant_id}/subscriptions/{agent_kind}/activate")
async def activate_subscription(
    tenant_id: str,
    agent_kind: str,
    request: Request,
    ctx: AuthContext = Depends(get_auth_context),
):
    """Assign a catalog plan to a tenant and activate it — the admin equivalent of a
    customer completing checkout, for gifted/manually-sold/enterprise subscriptions."""
    _staff(ctx, {"tech", "finance"})
    body = await request.json()
    plan_id = body.get("plan_id")
    if not plan_id:
        raise HTTPException(400, detail="plan_id is required")
    before = await execute_one_raw(
        "SELECT * FROM agent_subscriptions WHERE tenant_id = :tid AND agent_kind = :k",
        {"tid": tenant_id, "k": agent_kind},
    )
    result = await admin_assign_plan(tenant_id, plan_id, agent_kind=agent_kind, actor_id=ctx.user_id)
    await write_audit_log(
        actor_id=ctx.user_id,
        action="subscription.activate",
        resource_type="agent_subscription",
        resource_id=str(result["subscription"]["id"]),
        tenant_id=tenant_id,
        before_state=dict(before) if before else None,
        after_state=result["subscription"],
        metadata={"plan_id": str(plan_id)},
    )
    return result


@router.get("/tenants/{tenant_id}/topics")
async def admin_list_topics(tenant_id: str, ctx: AuthContext = Depends(get_auth_context)):
    _staff(ctx)
    tenant = await execute_one_raw("SELECT id FROM tenants WHERE id = :id", {"id": tenant_id})
    if not tenant:
        raise HTTPException(404, detail="Tenant not found")
    return {"topics": await list_catalog_topics(tenant_id)}


@router.patch("/tenants/{tenant_id}/topics/{topic_id}")
async def admin_update_topic(
    tenant_id: str,
    topic_id: int,
    body: TopicUpdateRequest,
    ctx: AuthContext = Depends(get_auth_context),
):
    _staff(ctx, {"tech", "support"})
    before = await execute_one_raw(
        "SELECT * FROM topics WHERE id = :id AND tenant_id = :tid", {"id": topic_id, "tid": tenant_id}
    )
    updated = await update_topic_for_tenant(tenant_id, topic_id, body)
    await write_audit_log(
        actor_id=ctx.user_id,
        action="topic.update",
        resource_type="topic",
        resource_id=str(topic_id),
        tenant_id=tenant_id,
        before_state=dict(before) if before else None,
        after_state=updated,
    )
    return updated


@router.post("/tenants/{tenant_id}/onboarding/reset")
async def admin_reset_onboarding(tenant_id: str, ctx: AuthContext = Depends(get_auth_context)):
    """Wipe a tenant's adaptive-onboarding profile, legacy answers, and generated topic
    catalog so they can be walked through onboarding again from a clean slate."""
    _staff(ctx, {"tech", "support"})
    tenant = await execute_one_raw("SELECT id FROM tenants WHERE id = :id", {"id": tenant_id})
    if not tenant:
        raise HTTPException(404, detail="Tenant not found")
    await delete_state(tenant_id)
    await execute_raw("DELETE FROM onboarding_answers WHERE tenant_id = :tid", {"tid": tenant_id})
    await execute_raw("DELETE FROM topics WHERE tenant_id = :tid", {"tid": tenant_id})
    await execute_raw("DELETE FROM tenant_topic_replacements WHERE tenant_id = :tid", {"tid": tenant_id})
    result = _reset_engine.reset()
    await save_state(tenant_id, result.profile, result.session, ctx.user_id)
    await write_audit_log(
        actor_id=ctx.user_id,
        action="onboarding.reset",
        resource_type="tenant",
        resource_id=tenant_id,
        tenant_id=tenant_id,
    )
    return {"ok": True}


@router.post("/tenants/{tenant_id}/credits")
async def adjust_credits(tenant_id: str, request: Request, ctx: AuthContext = Depends(get_auth_context)):
    _staff(ctx, {"finance", "tech"})
    body = await request.json()
    amount = int(body.get("amount", 0))
    reason = (body.get("reason") or "").strip()
    if not reason:
        raise HTTPException(400, detail="reason is required")
    if amount == 0:
        raise HTTPException(400, detail="amount must be non-zero")
    tenant = await execute_one_raw("SELECT credits_remaining FROM tenants WHERE id = :id", {"id": tenant_id})
    if not tenant:
        raise HTTPException(404, detail="Tenant not found")
    new_bal = int(tenant["credits_remaining"]) + amount
    if new_bal < 0:
        raise HTTPException(400, detail="Insufficient credits")
    await execute_raw(
        "UPDATE tenants SET credits_remaining = :b, updated_at = NOW() WHERE id = :id",
        {"b": new_bal, "id": tenant_id},
    )
    tx = await execute_one_raw(
        """
        INSERT INTO credit_transactions (tenant_id, amount, reason, admin_id, balance_after)
        VALUES (:tid, :amount, :reason, :admin_id, :bal)
        RETURNING *
        """,
        {"tid": tenant_id, "amount": amount, "reason": reason, "admin_id": ctx.user_id, "bal": new_bal},
    )
    await write_audit_log(
        actor_id=ctx.user_id,
        action="credits.adjust",
        resource_type="credit_transaction",
        resource_id=str(tx["id"]),
        tenant_id=tenant_id,
        after_state=dict(tx),
    )
    return tx


@router.post("/tenants/{tenant_id}/configs/{agent_kind}/rollback")
async def rollback_config(
    tenant_id: str,
    agent_kind: str,
    request: Request,
    ctx: AuthContext = Depends(get_auth_context),
):
    _staff(ctx, {"tech"})
    body = await request.json()
    version = int(body.get("version", 0))
    src = await execute_one_raw(
        "SELECT * FROM agent_configs WHERE tenant_id = :tid AND agent_kind = :k AND version = :v",
        {"tid": tenant_id, "k": agent_kind, "v": version},
    )
    if not src:
        raise HTTPException(404, detail="Config version not found")
    latest = await execute_one_raw(
        "SELECT COALESCE(MAX(version), 0) AS v FROM agent_configs WHERE tenant_id = :tid AND agent_kind = :k",
        {"tid": tenant_id, "k": agent_kind},
    )
    new_v = int(latest["v"]) + 1
    cfg = src["config"]
    if not isinstance(cfg, str):
        cfg = json.dumps(cfg)
    row = await execute_one_raw(
        """
        INSERT INTO agent_configs (tenant_id, agent_kind, version, config, created_by)
        VALUES (:tid, :k, :v, CAST(:cfg AS jsonb), :by)
        RETURNING *
        """,
        {"tid": tenant_id, "k": agent_kind, "v": new_v, "cfg": cfg, "by": ctx.user_id},
    )
    await write_audit_log(
        actor_id=ctx.user_id,
        action="config.rollback",
        resource_type="agent_config",
        resource_id=str(row["id"]),
        tenant_id=tenant_id,
        metadata={"from_version": version, "to_version": new_v},
    )
    return row


# ---------- Compliance ----------
@router.get("/compliance")
async def list_compliance(ctx: AuthContext = Depends(get_auth_context)):
    _staff(ctx)
    return {"rules": await execute_raw("SELECT * FROM compliance_rule_sets ORDER BY industry, name")}


@router.post("/compliance")
async def upsert_compliance(request: Request, ctx: AuthContext = Depends(get_auth_context)):
    _staff(ctx, {"tech", "support"})
    body = await request.json()
    row = await execute_one_raw(
        """
        INSERT INTO compliance_rule_sets
          (industry, name, forbidden_phrases, required_disclaimers, extra_rules, is_active,
           semantic_rules, requires_semantic_check, risk_tier, status)
        VALUES (:industry, :name, :phrases, :disc, CAST(:extra AS jsonb), COALESCE(:active, true),
                :semantic, COALESCE(:req_semantic, true), COALESCE(:tier, 2), COALESCE(:st, 'active'))
        ON CONFLICT (industry, name) DO UPDATE SET
          forbidden_phrases = EXCLUDED.forbidden_phrases,
          required_disclaimers = EXCLUDED.required_disclaimers,
          extra_rules = EXCLUDED.extra_rules,
          is_active = EXCLUDED.is_active,
          semantic_rules = EXCLUDED.semantic_rules,
          requires_semantic_check = EXCLUDED.requires_semantic_check,
          risk_tier = EXCLUDED.risk_tier,
          status = EXCLUDED.status,
          updated_at = NOW()
        RETURNING *
        """,
        {
            "industry": body["industry"],
            "name": body["name"],
            "phrases": body.get("forbidden_phrases") or [],
            "disc": body.get("required_disclaimers") or [],
            "extra": json.dumps(body.get("extra_rules") or {}),
            "active": body.get("is_active", True),
            "semantic": body.get("semantic_rules") or [],
            "req_semantic": body.get("requires_semantic_check", True),
            "tier": body.get("risk_tier", 2),
            "st": body.get("status", "active"),
        },
    )
    await write_audit_log(
        actor_id=ctx.user_id,
        action="compliance.upsert",
        resource_type="compliance_rule_set",
        resource_id=str(row["id"]),
        after_state=dict(row),
    )
    return row


# ---------- Approvals ----------
@router.get("/approvals")
async def list_approvals(
    tenant_id: Optional[str] = None,
    agent_kind: Optional[str] = None,
    status: str = "pending",
    ctx: AuthContext = Depends(get_auth_context),
):
    _staff(ctx)
    rows = await execute_raw(
        """
        SELECT a.*, t.name AS tenant_name FROM approval_items a
        JOIN tenants t ON t.id = a.tenant_id
        WHERE (CAST(:status AS text) IS NULL OR a.status::text = CAST(:status AS text))
          AND (CAST(:tenant_id AS text) IS NULL OR a.tenant_id::text = CAST(:tenant_id AS text))
          AND (CAST(:agent_kind AS text) IS NULL OR a.agent_kind::text = CAST(:agent_kind AS text))
        ORDER BY a.created_at DESC
        LIMIT 200
        """,
        {"status": status, "tenant_id": tenant_id, "agent_kind": agent_kind},
    )
    return {"items": rows}


@router.post("/approvals/{item_id}/decide")
async def decide_approval(item_id: str, request: Request, ctx: AuthContext = Depends(get_auth_context)):
    _staff(ctx)
    body = await request.json()
    decision = body.get("status")
    reason = body.get("reason") or ""
    if decision not in ("approved", "rejected"):
        raise HTTPException(400, detail="status must be approved or rejected")
    if decision == "rejected" and not reason.strip():
        raise HTTPException(400, detail="reason required when rejecting")
    before = await execute_one_raw("SELECT * FROM approval_items WHERE id = :id", {"id": item_id})
    if not before:
        raise HTTPException(404, detail="Not found")
    row = await execute_one_raw(
        """
        UPDATE approval_items
        SET status = CAST(:st AS approval_status), decision_reason = :reason,
            decided_by = :by, decided_at = NOW()
        WHERE id = :id RETURNING *
        """,
        {"st": decision, "reason": reason, "by": ctx.user_id, "id": item_id},
    )
    await write_audit_log(
        actor_id=ctx.user_id,
        action=f"approval.{decision}",
        resource_type="approval_item",
        resource_id=item_id,
        tenant_id=str(row["tenant_id"]),
        before_state=dict(before),
        after_state=dict(row),
    )
    return row


# ---------- Staff ----------
@router.get("/staff")
async def list_staff(ctx: AuthContext = Depends(get_auth_context)):
    _staff(ctx)
    return {"staff": await execute_raw("SELECT id, user_id, email, display_name, role, is_active, created_at FROM platform_staff ORDER BY role, email")}


@router.post("/staff")
async def upsert_staff(request: Request, ctx: AuthContext = Depends(get_auth_context)):
    _staff(ctx, {"tech"})
    body = await request.json()
    row = await execute_one_raw(
        """
        INSERT INTO platform_staff (user_id, email, display_name, role, is_active)
        VALUES (:uid, :email, :name, CAST(:role AS staff_role), COALESCE(:active, true))
        ON CONFLICT (user_id) DO UPDATE SET
          email = EXCLUDED.email, display_name = EXCLUDED.display_name,
          role = EXCLUDED.role, is_active = EXCLUDED.is_active
        RETURNING id, user_id, email, display_name, role, is_active, created_at
        """,
        {
            "uid": body["user_id"],
            "email": body["email"],
            "name": body.get("display_name"),
            "role": body["role"],
            "active": body.get("is_active", True),
        },
    )
    await write_audit_log(
        actor_id=ctx.user_id,
        action="staff.upsert",
        resource_type="platform_staff",
        resource_id=str(row["id"]),
        after_state=dict(row),
    )
    return row


# ---------- Audit ----------
@router.get("/audit-log")
async def audit_log(
    limit: int = Query(100, le=500),
    tenant_id: Optional[str] = None,
    ctx: AuthContext = Depends(get_auth_context),
):
    _staff(ctx)
    rows = await execute_raw(
        """
        SELECT * FROM audit_log
        WHERE (CAST(:tenant_id AS uuid) IS NULL OR tenant_id = CAST(:tenant_id AS uuid))
        ORDER BY created_at DESC LIMIT :lim
        """,
        {"tenant_id": tenant_id, "lim": limit},
    )
    return {"entries": rows}


# ---------- Platform posts (cross-tenant read) ----------
@router.get("/posts")
async def list_all_posts(
    status: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    ctx: AuthContext = Depends(get_auth_context),
):
    _staff(ctx)
    conditions = []
    params: dict = {"limit": limit, "offset": offset}
    if status:
        conditions.append("p.status = :status::post_status")
        params["status"] = status
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    rows = await execute_raw(
        f"""
        SELECT p.*, t.name AS topic_name, t.slug AS topic_slug,
               (SELECT score FROM post_performance WHERE post_id = p.id
                ORDER BY recorded_at DESC LIMIT 1) AS latest_score
        FROM posts p
        LEFT JOIN topics t ON p.topic_id = t.id
        {where}
        ORDER BY p.created_at DESC
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    cnt = await execute_one_raw(
        f"SELECT COUNT(*) AS count FROM posts p {where}",
        {k: v for k, v in params.items() if k not in ("limit", "offset")},
    )
    return {"posts": rows, "total": int((cnt or {}).get("count", 0))}


# ---------- Platform API key status (admin only; never returns secret values) ----------
@router.get("/platform-keys")
async def platform_keys(ctx: AuthContext = Depends(get_auth_context)):
    _staff(ctx, {"tech", "finance"})
    from app.core.config import settings as app_settings
    import os

    checks = {
        "GEMINI_API_KEY": bool(app_settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")),
        "GROK_API_KEY": bool(app_settings.GROK_API_KEY or os.getenv("GROK_API_KEY")),
        "LINKEDIN_CLIENT_ID": bool(app_settings.LINKEDIN_CLIENT_ID),
        "LINKEDIN_CLIENT_SECRET": bool(app_settings.LINKEDIN_CLIENT_SECRET),
        "ADMIN_JWT_SECRET": bool(app_settings.ADMIN_JWT_SECRET),
        "TOKEN_ENC_KEY": bool(app_settings.TOKEN_ENC_KEY),
        "SUPABASE_SERVICE_ROLE_KEY": bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY")),
    }
    return {"keys": {k: {"configured": v} for k, v in checks.items()}}


# ---------- Catalog (C-BILLING-CATALOG) ----------
@router.get("/catalog")
async def admin_catalog(ctx: AuthContext = Depends(get_auth_context)):
    _staff(ctx)
    return {
        "plans": await list_plans(active_only=False),
        "packs": await list_packs(active_only=False),
        "action_costs": await list_action_costs(active_only=False),
    }


@router.post("/catalog/plans")
async def admin_create_plan(request: Request, ctx: AuthContext = Depends(get_auth_context)):
    _staff(ctx, {"tech", "finance"})
    body = await request.json()
    row = await create_plan(body)
    await write_audit_log(
        actor_id=ctx.user_id,
        action="catalog.plan.create",
        resource_type="subscription_plan",
        resource_id=str(row["id"]),
        after_state=serialize_plan(row),
    )
    return row


@router.patch("/catalog/plans/{plan_id}")
async def admin_update_plan(
    plan_id: str, request: Request, ctx: AuthContext = Depends(get_auth_context)
):
    _staff(ctx, {"tech", "finance"})
    before = await lookup_catalog_row(
        "SELECT * FROM subscription_plans WHERE id = CAST(:id AS uuid)", plan_id
    )
    if not before:
        raise HTTPException(404, detail="Plan not found")
    body = await request.json()
    row = await update_plan(plan_id, body)
    await write_audit_log(
        actor_id=ctx.user_id,
        action="catalog.plan.update",
        resource_type="subscription_plan",
        resource_id=str(row["id"]),
        before_state=serialize_plan(before),
        after_state=serialize_plan(row),
    )
    return row


@router.post("/catalog/packs")
async def admin_create_pack(request: Request, ctx: AuthContext = Depends(get_auth_context)):
    _staff(ctx, {"tech", "finance"})
    body = await request.json()
    row = await create_pack(body)
    await write_audit_log(
        actor_id=ctx.user_id,
        action="catalog.pack.create",
        resource_type="credit_pack",
        resource_id=str(row["id"]),
        after_state=serialize_pack(row),
    )
    return row


@router.patch("/catalog/packs/{pack_id}")
async def admin_update_pack(
    pack_id: str, request: Request, ctx: AuthContext = Depends(get_auth_context)
):
    _staff(ctx, {"tech", "finance"})
    before = await lookup_catalog_row(
        "SELECT * FROM credit_packs WHERE id = CAST(:id AS uuid)", pack_id
    )
    if not before:
        raise HTTPException(404, detail="Credit pack not found")
    body = await request.json()
    row = await update_pack(pack_id, body)
    await write_audit_log(
        actor_id=ctx.user_id,
        action="catalog.pack.update",
        resource_type="credit_pack",
        resource_id=str(row["id"]),
        before_state=serialize_pack(before),
        after_state=serialize_pack(row),
    )
    return row


@router.post("/catalog/action_costs")
async def admin_create_action_cost(request: Request, ctx: AuthContext = Depends(get_auth_context)):
    _staff(ctx, {"tech", "finance"})
    body = await request.json()
    row = await create_action_cost(body)
    await write_audit_log(
        actor_id=ctx.user_id,
        action="catalog.action_cost.create",
        resource_type="credit_action_cost",
        resource_id=str(row["id"]),
        after_state=serialize_action_cost(row),
    )
    return row


@router.patch("/catalog/action_costs/{action_cost_id}")
async def admin_update_action_cost(
    action_cost_id: str, request: Request, ctx: AuthContext = Depends(get_auth_context)
):
    _staff(ctx, {"tech", "finance"})
    before = await lookup_catalog_row(
        "SELECT * FROM credit_action_costs WHERE id = CAST(:id AS uuid)",
        action_cost_id,
    )
    if not before:
        raise HTTPException(404, detail="Action cost not found")
    body = await request.json()
    row = await update_action_cost(action_cost_id, body)
    await write_audit_log(
        actor_id=ctx.user_id,
        action="catalog.action_cost.update",
        resource_type="credit_action_cost",
        resource_id=str(row["id"]),
        before_state=serialize_action_cost(before),
        after_state=serialize_action_cost(row),
    )
    return row
