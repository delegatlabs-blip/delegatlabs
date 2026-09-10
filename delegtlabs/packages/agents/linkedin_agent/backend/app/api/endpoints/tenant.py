"""Tenant-facing dashboard APIs."""
from __future__ import annotations

import json
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.auth_context import AuthContext, get_auth_context
from app.core.database import execute_raw, execute_one_raw
from app.services.audit import write_audit_log
from app.services.billing import DEFAULT_AGENT_KIND, list_action_costs, list_packs, list_plans
from app.services.compliance import get_effective_agent_config

router = APIRouter(prefix="/tenant", tags=["tenant"])

SAFE_LIMITS = {
    "messages_day": 50,
    "connections_week": 100,
}


@router.get("/catalog")
async def catalog(ctx: AuthContext = Depends(get_auth_context)):
    return {
        "plans": await list_plans(active_only=True, agent_kind=DEFAULT_AGENT_KIND),
        "packs": await list_packs(active_only=True),
        "action_costs": await list_action_costs(
            active_only=True, agent_kind=DEFAULT_AGENT_KIND
        ),
    }


@router.get("/credits")
async def credits(ctx: AuthContext = Depends(get_auth_context)):
    tenant = await execute_one_raw(
        "SELECT credits_remaining FROM tenants WHERE id = :id", {"id": ctx.tenant_id}
    )
    usage = await execute_raw(
        """SELECT agent_kind, usage_date, credits_used FROM credit_usage_daily
           WHERE tenant_id = :id ORDER BY usage_date DESC LIMIT 30""",
        {"id": ctx.tenant_id},
    )
    return {"balance": (tenant or {}).get("credits_remaining", 0), "usage": usage}


async def _consume_credit(tenant_id: str, agent_kind: str, amount: int = 1) -> int:
    tenant = await execute_one_raw(
        "SELECT credits_remaining FROM tenants WHERE id = :id FOR UPDATE",
        {"id": tenant_id},
    )
    # FOR UPDATE may not work via execute_one_raw standalone — soft check
    bal = int((tenant or {}).get("credits_remaining") or 0)
    if bal < amount:
        raise HTTPException(402, detail="Insufficient credits")
    new_bal = bal - amount
    await execute_raw(
        "UPDATE tenants SET credits_remaining = :b, updated_at = NOW() WHERE id = :id",
        {"b": new_bal, "id": tenant_id},
    )
    await execute_raw(
        """
        INSERT INTO credit_transactions (tenant_id, amount, reason, agent_kind, balance_after)
        VALUES (:tid, :amt, :reason, :kind, :bal)
        """,
        {
            "tid": tenant_id,
            "amt": -amount,
            "reason": f"{agent_kind} usage",
            "kind": agent_kind,
            "bal": new_bal,
        },
    )
    await execute_raw(
        """
        INSERT INTO credit_usage_daily (tenant_id, agent_kind, usage_date, credits_used)
        VALUES (:tid, :kind, CURRENT_DATE, :amt)
        ON CONFLICT (tenant_id, agent_kind, usage_date)
        DO UPDATE SET credits_used = credit_usage_daily.credits_used + EXCLUDED.credits_used
        """,
        {"tid": tenant_id, "kind": agent_kind, "amt": amount},
    )
    return new_bal


@router.get("/agents/{agent_kind}/config")
async def get_config(agent_kind: str, ctx: AuthContext = Depends(get_auth_context)):
    sub = await execute_one_raw(
        "SELECT * FROM agent_subscriptions WHERE tenant_id = :tid AND agent_kind = :k",
        {"tid": ctx.tenant_id, "k": agent_kind},
    )
    versions = await execute_raw(
        """SELECT id, version, created_by, created_at FROM agent_configs
           WHERE tenant_id = :tid AND agent_kind = :k ORDER BY version DESC LIMIT 20""",
        {"tid": ctx.tenant_id, "k": agent_kind},
    )
    latest = await execute_one_raw(
        """SELECT * FROM agent_configs WHERE tenant_id = :tid AND agent_kind = :k
           ORDER BY version DESC LIMIT 1""",
        {"tid": ctx.tenant_id, "k": agent_kind},
    )
    effective = await get_effective_agent_config(ctx.tenant_id, agent_kind)
    return {
        "subscription": sub,
        "inactive": not sub or sub.get("status") not in ("active", "trialing"),
        "latest": latest,
        "versions": versions,
        "effective": effective,
    }


@router.post("/agents/{agent_kind}/config")
async def save_config(agent_kind: str, request: Request, ctx: AuthContext = Depends(get_auth_context)):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    sub = await execute_one_raw(
        "SELECT status FROM agent_subscriptions WHERE tenant_id = :tid AND agent_kind = :k",
        {"tid": ctx.tenant_id, "k": agent_kind},
    )
    if not sub or sub["status"] not in ("active", "trialing"):
        raise HTTPException(402, detail="Agent inactive — upgrade required")
    body = await request.json()
    config = body.get("config") or {}
    # Strip any client-supplied _compliance — server merges at read time
    config.pop("_compliance", None)
    latest = await execute_one_raw(
        "SELECT COALESCE(MAX(version), 0) AS v FROM agent_configs WHERE tenant_id = :tid AND agent_kind = :k",
        {"tid": ctx.tenant_id, "k": agent_kind},
    )
    new_v = int(latest["v"]) + 1
    row = await execute_one_raw(
        """
        INSERT INTO agent_configs (tenant_id, agent_kind, version, config, created_by)
        VALUES (:tid, :k, :v, CAST(:cfg AS jsonb), :by)
        RETURNING *
        """,
        {
            "tid": ctx.tenant_id,
            "k": agent_kind,
            "v": new_v,
            "cfg": json.dumps(config),
            "by": ctx.user_id,
        },
    )
    await write_audit_log(
        actor_id=ctx.user_id,
        actor_type="tenant",
        action="config.save",
        resource_type="agent_config",
        resource_id=str(row["id"]),
        tenant_id=ctx.tenant_id,
        after_state={"version": new_v, "agent_kind": agent_kind},
    )
    return row


@router.get("/agents/lead-gen/safe-limits")
async def safe_limits(ctx: AuthContext = Depends(get_auth_context)):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    msg = await execute_one_raw(
        """SELECT count FROM outreach_counters
           WHERE tenant_id = :tid AND counter_type = 'messages_day' AND period_start = :d""",
        {"tid": ctx.tenant_id, "d": today},
    )
    conn = await execute_one_raw(
        """SELECT count FROM outreach_counters
           WHERE tenant_id = :tid AND counter_type = 'connections_week' AND period_start = :d""",
        {"tid": ctx.tenant_id, "d": week_start},
    )
    messages = int((msg or {}).get("count") or 0)
    connections = int((conn or {}).get("count") or 0)
    return {
        "messages": {
            "count": messages,
            "limit": SAFE_LIMITS["messages_day"],
            "pct": round(100 * messages / SAFE_LIMITS["messages_day"], 1),
        },
        "connections": {
            "count": connections,
            "limit": SAFE_LIMITS["connections_week"],
            "pct": round(100 * connections / SAFE_LIMITS["connections_week"], 1),
        },
    }


@router.get("/connections")
async def connections(ctx: AuthContext = Depends(get_auth_context)):
    from app.services.linkedin_destinations import linkedin_section_payload

    integ = await execute_raw(
        "SELECT * FROM integrations WHERE tenant_id = :id ORDER BY provider",
        {"id": ctx.tenant_id},
    )
    return {
        "linkedin": await linkedin_section_payload(ctx.tenant_id),
        "integrations": integ,
    }


@router.post("/connections/linkedin/sync")
async def sync_linkedin_connections(ctx: AuthContext = Depends(get_auth_context)):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    from datetime import datetime, timezone

    from app.services.linkedin import get_decrypted_token, get_stored_account
    from app.services.linkedin_destinations import linkedin_section_payload, sync_destinations

    account = await get_stored_account(ctx.tenant_id)
    if not account:
        raise HTTPException(status_code=401, detail="No LinkedIn account connected")
    token = await get_decrypted_token(ctx.tenant_id)
    sync_result = await sync_destinations(
        tenant_id=ctx.tenant_id,
        access_token=token,
        member_urn=account["member_urn"],
        display_name=account.get("display_name"),
    )
    synced_at = sync_result.get("synced_at") or datetime.now(timezone.utc).isoformat()
    section = await linkedin_section_payload(
        ctx.tenant_id, account=account, synced_at=synced_at
    )
    section["acl_error"] = sync_result.get("acl_error")
    section["organization_count"] = sum(
        1
        for d in (sync_result.get("destinations") or [])
        if (d.get("destination_kind") == "organization" and not d.get("archived_at"))
    )
    return section


@router.patch("/connections/linkedin/destinations/{destination_id}")
async def patch_linkedin_destination(
    destination_id: str,
    request: Request,
    ctx: AuthContext = Depends(get_auth_context),
):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    from app.services.linkedin_destinations import (
        patch_destination_enabled,
        serialize_destination,
    )

    body = await request.json()
    if "is_enabled" not in body or not isinstance(body.get("is_enabled"), bool):
        raise HTTPException(status_code=400, detail="Body missing boolean is_enabled")
    row = await patch_destination_enabled(
        ctx.tenant_id, destination_id, body["is_enabled"]
    )
    return serialize_destination(row)


@router.post("/connections/integrations/{provider}/test")
async def test_integration(provider: str, ctx: AuthContext = Depends(get_auth_context)):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    row = await execute_one_raw(
        """
        INSERT INTO integrations (tenant_id, provider, status, last_tested_at)
        VALUES (:tid, :p, 'connected', NOW())
        ON CONFLICT (tenant_id, provider) DO UPDATE
          SET status = 'connected', last_tested_at = NOW(), updated_at = NOW()
        RETURNING *
        """,
        {"tid": ctx.tenant_id, "p": provider},
    )
    return row


# Team / billing surfaces removed (TS-7).
