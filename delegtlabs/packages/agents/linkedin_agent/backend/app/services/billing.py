"""Billing catalog: subscription plans, credit packs, and the per-action meter.

Everything the pricing UI renders comes from these three tables, so pricing
changes are an admin-panel edit, not a deploy. Money is stored in the currency's
minor unit (paise for INR) and never converted here — the client formats it.
"""
from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any, Optional

from fastapi import HTTPException
from sqlalchemy.dialects.postgresql.asyncpg import AsyncAdapt_asyncpg_dbapi
from sqlalchemy.exc import DBAPIError, DataError, IntegrityError

from app.core.database import execute_one_raw, execute_raw

try:
    from asyncpg.exceptions import DataError as AsyncpgDataError
except ImportError:
    AsyncpgDataError = None

# G4 — installed linkedin-agent-backend: SQLAlchemy 2.0.52, asyncpg 0.31.0.
# asyncpg.exceptions.DataError is a PostgresError and is translated to
# AsyncAdapt_asyncpg_dbapi.Error, which is NOT a subclass of sqlalchemy.exc.DataError
# or sqlalchemy.exc.DBAPIError. SQLAlchemy then wraps that as DBAPIError.
_CATALOG_DB_ERRORS: tuple[type[BaseException], ...] = (
    IntegrityError,
    DataError,
    DBAPIError,
    AsyncAdapt_asyncpg_dbapi.Error,
)
if AsyncpgDataError is not None:
    _CATALOG_DB_ERRORS = (*_CATALOG_DB_ERRORS, AsyncpgDataError)

_INT32_MAX = 2**31 - 1

DEFAULT_AGENT_KIND = "post_gen"

# Written to credit_transactions.kind so the Credits tab can separate top-ups
# from consumption without parsing the free-text reason.
TX_PURCHASE = "purchase"
TX_USAGE = "usage"
TX_GRANT = "grant"


def _jsonb(value: Any, fallback: Any) -> Any:
    """jsonb comes back as str on some drivers and as a parsed object on others."""
    if value is None:
        return fallback
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return fallback


# C-BILLING-CATALOG §4.3 — allowlisted write fields only (no mass-assign).
PLAN_WRITE_FIELDS = (
    "code",
    "name",
    "description",
    "agent_kind",
    "tier",
    "price_inr_minor",
    "price_usd_minor",
    "billing_period",
    "monthly_credits",
    "rollover_months",
    "seats",
    "linkedin_accounts",
    "features",
    "badge",
    "is_active",
    "is_default",
    "sort_order",
    "daily_text",
    "daily_image",
    "weekly_image",
)
PLAN_REQUIRED_CREATE = ("code", "name", "price_inr_minor", "price_usd_minor")

PACK_WRITE_FIELDS = (
    "code",
    "name",
    "description",
    "price_inr_minor",
    "price_usd_minor",
    "credits",
    "bonus_credits",
    "badge",
    "is_active",
    "sort_order",
)
PACK_REQUIRED_CREATE = ("code", "name", "credits", "price_inr_minor", "price_usd_minor")

ACTION_COST_WRITE_FIELDS = (
    "action_key",
    "label",
    "description",
    "agent_kind",
    "credits",
    "is_active",
    "sort_order",
)
ACTION_COST_REQUIRED_CREATE = ("action_key", "label", "credits")


def _iso_ts(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return value


def serialize_plan(row: dict) -> dict:
    plan = dict(row)
    plan["id"] = str(plan["id"])
    plan["features"] = _jsonb(plan.get("features"), [])
    plan["created_at"] = _iso_ts(plan.get("created_at"))
    plan["updated_at"] = _iso_ts(plan.get("updated_at"))
    # Forbidden on catalog HTTP (C-BILLING-CATALOG §2.1) if an old row shape leaks.
    plan.pop("currency", None)
    plan.pop("price_minor", None)
    for key in ("daily_text", "daily_image", "weekly_image"):
        if key in plan and plan[key] is not None:
            plan[key] = int(plan[key])
    return plan


def serialize_pack(row: dict) -> dict:
    pack = dict(row)
    pack["id"] = str(pack["id"])
    pack["total_credits"] = int(pack["credits"]) + int(pack.get("bonus_credits") or 0)
    pack["created_at"] = _iso_ts(pack.get("created_at"))
    pack["updated_at"] = _iso_ts(pack.get("updated_at"))
    pack.pop("currency", None)
    pack.pop("price_minor", None)
    return pack


def serialize_action_cost(row: dict) -> dict:
    cost = dict(row)
    cost["id"] = str(cost["id"])
    cost["updated_at"] = _iso_ts(cost.get("updated_at"))
    return cost


def _allowlisted(body: dict, allowed: tuple[str, ...]) -> dict:
    return {key: body[key] for key in allowed if key in body}


def _require_create_fields(fields: dict, required: tuple[str, ...]) -> None:
    missing = [key for key in required if key not in fields or fields[key] is None]
    if missing:
        raise HTTPException(400, detail=f"{missing[0]} is required")


def _catalog_write_http(exc: Exception) -> HTTPException:
    """Unique / CHECK / enum failures are 400. Do not flip another is_default row."""
    orig = getattr(exc, "orig", None)
    text = str(orig if orig is not None else exc)
    if "uq_sub_plans_default" in text:
        return HTTPException(400, detail="A default plan already exists for this agent_kind")
    return HTTPException(400, detail="Catalog constraint violated")


def _is_invalid_uuid_error(exc: BaseException) -> bool:
    parts = [str(exc)]
    orig = getattr(exc, "orig", None)
    if orig is not None:
        parts.append(str(orig))
    text = " ".join(parts).lower()
    return "invalid uuid" in text or "invalid input syntax for type uuid" in text


async def _exec_catalog_write(sql: str, params: dict) -> Optional[dict]:
    try:
        return await execute_one_raw(sql, params)
    except HTTPException:
        raise
    except _CATALOG_DB_ERRORS as exc:
        if _is_invalid_uuid_error(exc):
            return None
        raise _catalog_write_http(exc) from exc
    except Exception as exc:
        if _is_invalid_uuid_error(exc):
            return None
        text = str(getattr(exc, "orig", exc))
        if "uq_sub_plans_default" in text or "duplicate" in text.lower():
            raise _catalog_write_http(exc) from exc
        raise


async def lookup_catalog_row(sql: str, record_id: str) -> Optional[dict]:
    """SELECT by CAST(:id AS uuid). Invalid UUID is None — same as unknown id."""
    try:
        return await execute_one_raw(sql, {"id": record_id})
    except HTTPException:
        raise
    except _CATALOG_DB_ERRORS as exc:
        if _is_invalid_uuid_error(exc):
            return None
        raise


def _require_json_int(value: Any) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise HTTPException(400, detail="Catalog constraint violated")
    return value


def _require_nonneg_int(fields: dict, *keys: str) -> None:
    for key in keys:
        if key not in fields or fields[key] is None:
            continue
        value = _require_json_int(fields[key])
        if value < 0 or value > _INT32_MAX:
            raise HTTPException(400, detail="Catalog constraint violated")
        fields[key] = value


def _require_positive_int(fields: dict, key: str) -> None:
    if key not in fields or fields[key] is None:
        return
    value = _require_json_int(fields[key])
    if value <= 0 or value > _INT32_MAX:
        raise HTTPException(400, detail="Catalog constraint violated")
    fields[key] = value


def _sql_placeholder(column: str, *, enum_casts: dict[str, str]) -> str:
    if column == "features":
        return "CAST(:features AS jsonb)"
    if column in enum_casts:
        return f"CAST(:{column} AS {enum_casts[column]})"
    return f":{column}"


def _features_are_strings(feats: Any) -> bool:
    return isinstance(feats, list) and all(isinstance(item, str) for item in feats)


def _prepare_features(fields: dict) -> None:
    if "features" not in fields:
        return
    feats = fields["features"]
    if feats is None:
        fields["features"] = "[]"
        return
    if isinstance(feats, str):
        parsed = _jsonb(feats, None)
        if not _features_are_strings(parsed):
            raise HTTPException(400, detail="features must be an array of strings")
        fields["features"] = json.dumps(parsed)
        return
    if not _features_are_strings(feats):
        raise HTTPException(400, detail="features must be an array of strings")
    fields["features"] = json.dumps(feats)


async def list_plans(*, active_only: bool = True, agent_kind: Optional[str] = None) -> list[dict]:
    rows = await execute_raw(
        """
        SELECT * FROM subscription_plans
        WHERE (NOT :active_only OR is_active)
          AND (CAST(:agent_kind AS text) IS NULL OR agent_kind::text = CAST(:agent_kind AS text))
        ORDER BY sort_order, price_inr_minor
        """,
        {"active_only": active_only, "agent_kind": agent_kind},
    )
    return [serialize_plan(r) for r in rows]


async def list_packs(*, active_only: bool = True) -> list[dict]:
    rows = await execute_raw(
        """
        SELECT * FROM credit_packs
        WHERE (NOT :active_only OR is_active)
        ORDER BY sort_order, price_inr_minor
        """,
        {"active_only": active_only},
    )
    return [serialize_pack(r) for r in rows]


async def list_action_costs(
    *, active_only: bool = True, agent_kind: Optional[str] = None
) -> list[dict]:
    rows = await execute_raw(
        """
        SELECT * FROM credit_action_costs
        WHERE (NOT :active_only OR is_active)
          AND (CAST(:agent_kind AS text) IS NULL OR agent_kind::text = CAST(:agent_kind AS text))
        ORDER BY sort_order, action_key
        """,
        {"active_only": active_only, "agent_kind": agent_kind},
    )
    return [serialize_action_cost(r) for r in rows]


_PLAN_ENUM_CASTS = {"agent_kind": "agent_kind", "tier": "subscription_tier"}
_ACTION_COST_ENUM_CASTS = {"agent_kind": "agent_kind"}
_NO_ENUM_CASTS: dict[str, str] = {}


def _as_write_body(body: Any) -> dict:
    if not isinstance(body, dict):
        raise HTTPException(400, detail="JSON object required")
    return body


async def create_plan(body: Any) -> dict:
    fields = _allowlisted(_as_write_body(body), PLAN_WRITE_FIELDS)
    _require_create_fields(fields, PLAN_REQUIRED_CREATE)
    _require_nonneg_int(
        fields,
        "price_inr_minor",
        "price_usd_minor",
        "monthly_credits",
        "rollover_months",
        "sort_order",
        "daily_text",
        "daily_image",
        "weekly_image",
    )
    _prepare_features(fields)
    cols = list(fields.keys())
    placeholders = [_sql_placeholder(c, enum_casts=_PLAN_ENUM_CASTS) for c in cols]
    sql = f"""
        INSERT INTO subscription_plans ({", ".join(cols)})
        VALUES ({", ".join(placeholders)})
        RETURNING *
    """
    row = await _exec_catalog_write(sql, fields)
    if not row:
        raise HTTPException(400, detail="Catalog constraint violated")
    return serialize_plan(row)


async def update_plan(plan_id: str, body: Any) -> dict:
    fields = _allowlisted(_as_write_body(body), PLAN_WRITE_FIELDS)
    if not fields:
        raise HTTPException(400, detail="No fields to update")
    _require_nonneg_int(
        fields,
        "price_inr_minor",
        "price_usd_minor",
        "monthly_credits",
        "rollover_months",
        "sort_order",
        "daily_text",
        "daily_image",
        "weekly_image",
    )
    _prepare_features(fields)
    sets = [f"{c} = {_sql_placeholder(c, enum_casts=_PLAN_ENUM_CASTS)}" for c in fields]
    sets.append("updated_at = NOW()")
    params = {**fields, "id": plan_id}
    sql = f"""
        UPDATE subscription_plans
        SET {", ".join(sets)}
        WHERE id = CAST(:id AS uuid)
        RETURNING *
    """
    row = await _exec_catalog_write(sql, params)
    if not row:
        raise HTTPException(404, detail="Plan not found")
    return serialize_plan(row)


async def create_pack(body: Any) -> dict:
    fields = _allowlisted(_as_write_body(body), PACK_WRITE_FIELDS)
    _require_create_fields(fields, PACK_REQUIRED_CREATE)
    _require_nonneg_int(fields, "price_inr_minor", "price_usd_minor", "bonus_credits", "sort_order")
    _require_positive_int(fields, "credits")
    cols = list(fields.keys())
    placeholders = [_sql_placeholder(c, enum_casts=_NO_ENUM_CASTS) for c in cols]
    sql = f"""
        INSERT INTO credit_packs ({", ".join(cols)})
        VALUES ({", ".join(placeholders)})
        RETURNING *
    """
    row = await _exec_catalog_write(sql, fields)
    if not row:
        raise HTTPException(400, detail="Catalog constraint violated")
    return serialize_pack(row)


async def update_pack(pack_id: str, body: Any) -> dict:
    fields = _allowlisted(_as_write_body(body), PACK_WRITE_FIELDS)
    if not fields:
        raise HTTPException(400, detail="No fields to update")
    _require_nonneg_int(fields, "price_inr_minor", "price_usd_minor", "bonus_credits", "sort_order")
    _require_positive_int(fields, "credits")
    sets = [f"{c} = {_sql_placeholder(c, enum_casts=_NO_ENUM_CASTS)}" for c in fields]
    sets.append("updated_at = NOW()")
    params = {**fields, "id": pack_id}
    sql = f"""
        UPDATE credit_packs
        SET {", ".join(sets)}
        WHERE id = CAST(:id AS uuid)
        RETURNING *
    """
    row = await _exec_catalog_write(sql, params)
    if not row:
        raise HTTPException(404, detail="Credit pack not found")
    return serialize_pack(row)


async def create_action_cost(body: Any) -> dict:
    fields = _allowlisted(_as_write_body(body), ACTION_COST_WRITE_FIELDS)
    _require_create_fields(fields, ACTION_COST_REQUIRED_CREATE)
    _require_nonneg_int(fields, "credits", "sort_order")
    cols = list(fields.keys())
    placeholders = [_sql_placeholder(c, enum_casts=_ACTION_COST_ENUM_CASTS) for c in cols]
    sql = f"""
        INSERT INTO credit_action_costs ({", ".join(cols)})
        VALUES ({", ".join(placeholders)})
        RETURNING *
    """
    row = await _exec_catalog_write(sql, fields)
    if not row:
        raise HTTPException(400, detail="Catalog constraint violated")
    return serialize_action_cost(row)


async def update_action_cost(action_cost_id: str, body: Any) -> dict:
    fields = _allowlisted(_as_write_body(body), ACTION_COST_WRITE_FIELDS)
    if not fields:
        raise HTTPException(400, detail="No fields to update")
    _require_nonneg_int(fields, "credits", "sort_order")
    sets = [f"{c} = {_sql_placeholder(c, enum_casts=_ACTION_COST_ENUM_CASTS)}" for c in fields]
    sets.append("updated_at = NOW()")
    params = {**fields, "id": action_cost_id}
    sql = f"""
        UPDATE credit_action_costs
        SET {", ".join(sets)}
        WHERE id = CAST(:id AS uuid)
        RETURNING *
    """
    row = await _exec_catalog_write(sql, params)
    if not row:
        raise HTTPException(404, detail="Action cost not found")
    return serialize_action_cost(row)


async def action_cost(action_key: str) -> int:
    """Credits an action costs right now. Unknown/inactive actions are free."""
    row = await execute_one_raw(
        "SELECT credits FROM credit_action_costs WHERE action_key = :k AND is_active",
        {"k": action_key},
    )
    return int(row["credits"]) if row else 0


async def get_subscription(tenant_id: str, agent_kind: str = DEFAULT_AGENT_KIND) -> Optional[dict]:
    return await execute_one_raw(
        """
        SELECT s.*, p.code AS plan_code, p.name AS plan_name,
               p.price_inr_minor, p.price_usd_minor, p.billing_period, p.monthly_credits
        FROM agent_subscriptions s
        LEFT JOIN subscription_plans p ON p.id = s.plan_id
        WHERE s.tenant_id = :tid AND s.agent_kind = :k
        """,
        {"tid": tenant_id, "k": agent_kind},
    )


async def credit_balance(tenant_id: str) -> int:
    row = await execute_one_raw(
        "SELECT credits_remaining FROM tenants WHERE id = :id", {"id": tenant_id}
    )
    return int((row or {}).get("credits_remaining") or 0)


async def get_catalog(tenant_id: str, agent_kind: str = DEFAULT_AGENT_KIND) -> dict:
    """Everything the Subscription and Credits tabs need, in one round trip."""
    sub = await get_subscription(tenant_id, agent_kind)
    return {
        "plans": await list_plans(agent_kind=agent_kind),
        "packs": await list_packs(),
        "action_costs": await list_action_costs(),
        "subscription": {**sub, "id": str(sub["id"]), "plan_id": str(sub["plan_id"]) if sub.get("plan_id") else None} if sub else None,
        "balance": await credit_balance(tenant_id),
    }


async def _record(
    *,
    tenant_id: str,
    amount: int,
    reason: str,
    kind: str,
    balance_after: int,
    agent_kind: Optional[str] = None,
    pack_id: Optional[str] = None,
    admin_id: Optional[str] = None,
) -> dict:
    return await execute_one_raw(
        """
        INSERT INTO credit_transactions
          (tenant_id, amount, reason, agent_kind, admin_id, balance_after, pack_id, kind)
        VALUES (:tid, :amt, :reason, CAST(:agent AS agent_kind), :admin, :bal,
                CAST(:pack AS uuid), :kind)
        RETURNING *
        """,
        {
            "tid": tenant_id,
            "amt": amount,
            "reason": reason,
            "agent": agent_kind,
            "admin": admin_id,
            "bal": balance_after,
            "pack": pack_id,
            "kind": kind,
        },
    )


async def purchase_pack(tenant_id: str, pack_id: str, *, actor_id: Optional[str] = None) -> dict:
    """Grant a pack's credits. No payment gateway yet — the ledger is real, the
    charge is not."""
    pack = await execute_one_raw(
        "SELECT * FROM credit_packs WHERE id = CAST(:id AS uuid) AND is_active",
        {"id": pack_id},
    )
    if not pack:
        raise HTTPException(404, detail="Credit pack not found")

    granted = int(pack["credits"]) + int(pack.get("bonus_credits") or 0)
    row = await execute_one_raw(
        """
        UPDATE tenants SET credits_remaining = credits_remaining + :amt, updated_at = NOW()
        WHERE id = :tid RETURNING credits_remaining
        """,
        {"amt": granted, "tid": tenant_id},
    )
    if not row:
        raise HTTPException(404, detail="Tenant not found")

    tx = await _record(
        tenant_id=tenant_id,
        amount=granted,
        reason=f"Purchased {pack['name']} pack",
        kind=TX_PURCHASE,
        balance_after=int(row["credits_remaining"]),
        pack_id=str(pack["id"]),
        admin_id=actor_id,
    )
    return {
        "pack": serialize_pack(pack),
        "credits_granted": granted,
        "balance": int(row["credits_remaining"]),
        "transaction": {**tx, "id": str(tx["id"])},
    }


async def select_plan(
    tenant_id: str,
    plan_id: str,
    *,
    agent_kind: str = DEFAULT_AGENT_KIND,
    actor_id: Optional[str] = None,
    grant_credits: bool = True,
) -> dict:
    """Move a tenant onto a plan. Does not grant monthly_credits even if grant_credits is True.
    """
    plan = await execute_one_raw(
        "SELECT * FROM subscription_plans WHERE id = CAST(:id AS uuid) AND is_active",
        {"id": plan_id},
    )
    if not plan:
        raise HTTPException(404, detail="Plan not found")
    if plan["agent_kind"] != agent_kind:
        raise HTTPException(400, detail="Plan belongs to a different agent")

    sub = await execute_one_raw(
        """
        INSERT INTO agent_subscriptions
          (tenant_id, agent_kind, tier, status, plan_id, current_period_start)
        VALUES (:tid, CAST(:k AS agent_kind), :tier, 'active', :pid, NOW())
        ON CONFLICT (tenant_id, agent_kind) DO UPDATE
          SET plan_id = EXCLUDED.plan_id,
              tier = EXCLUDED.tier,
              status = 'active',
              current_period_start = NOW(),
              updated_at = NOW()
        RETURNING *
        """,
        {"tid": tenant_id, "k": agent_kind, "tier": plan["tier"], "pid": str(plan["id"])},
    )

    # Q-8 / C-billing-catalog §6: never ADD monthly_credits or INSERT kind=grant from this
    # function, even when grant_credits is True.
    _ = (grant_credits, actor_id)
    granted = 0
    balance = await credit_balance(tenant_id)

    return {
        "subscription": {**sub, "id": str(sub["id"]), "plan_id": str(sub["plan_id"])},
        "plan": serialize_plan(plan),
        "credits_granted": granted,
        "balance": balance,
    }


async def admin_assign_plan(tenant_id: str, plan_id: str, *, agent_kind: str = DEFAULT_AGENT_KIND, actor_id: Optional[str] = None) -> dict:
    """Admin-initiated equivalent of a customer completing checkout for a plan: assigns
    and activates a catalog plan on a tenant's subscription. Kept as its own service
    entry point (rather than calling select_plan from an endpoint) so admin.py never
    references select_plan directly -- see C-BILLING-CATALOG / TS-8 AC-OOS-03."""
    return await select_plan(tenant_id, plan_id, agent_kind=agent_kind, actor_id=actor_id, grant_credits=False)


async def resolve_post_gen_plan(tenant_id: str) -> Optional[dict]:
    """Assigned plan_id only. NULL plan_id → None. Does not lookup is_default or code=free."""
    sub = await execute_one_raw(
        """
        SELECT * FROM agent_subscriptions
        WHERE tenant_id = CAST(:tid AS uuid) AND agent_kind = CAST(:k AS agent_kind)
        """,
        {"tid": tenant_id, "k": DEFAULT_AGENT_KIND},
    )
    if not sub:
        return None
    if str(sub.get("status") or "") not in ("active", "trialing"):
        return None
    plan_id = sub.get("plan_id")
    if plan_id is None:
        return None
    plan = await execute_one_raw(
        "SELECT * FROM subscription_plans WHERE id = CAST(:id AS uuid)",
        {"id": str(plan_id)},
    )
    if not plan or not plan.get("is_active"):
        return None
    return serialize_plan(plan)


async def consume_for_action(
    tenant_id: str,
    action_key: str,
    *,
    agent_kind: str = DEFAULT_AGENT_KIND,
    quantity: int = 1,
) -> int:
    """Debit the meter for one billable action. Returns the new balance.

    Free actions (cost 0, e.g. manual_post) short-circuit without touching the
    ledger. Raises 402 when the wallet cannot cover the action.
    """
    unit = await action_cost(action_key)
    amount = unit * max(quantity, 0)
    if amount <= 0:
        return await credit_balance(tenant_id)

    # Single statement so the read-modify-write cannot interleave with another
    # request; the WHERE clause is the overdraft guard.
    row = await execute_one_raw(
        """
        UPDATE tenants
        SET credits_remaining = credits_remaining - :amt, updated_at = NOW()
        WHERE id = :tid AND credits_remaining >= :amt
        RETURNING credits_remaining
        """,
        {"amt": amount, "tid": tenant_id},
    )
    if not row:
        raise HTTPException(
            402,
            detail=f"Insufficient credits — {action_key} costs {amount}, "
                   f"balance is {await credit_balance(tenant_id)}",
        )

    balance = int(row["credits_remaining"])
    await _record(
        tenant_id=tenant_id,
        amount=-amount,
        reason=f"{action_key} x{quantity}",
        kind=TX_USAGE,
        balance_after=balance,
        agent_kind=agent_kind,
    )
    await execute_raw(
        """
        INSERT INTO credit_usage_daily (tenant_id, agent_kind, usage_date, credits_used)
        VALUES (:tid, CAST(:kind AS agent_kind), CURRENT_DATE, :amt)
        ON CONFLICT (tenant_id, agent_kind, usage_date)
        DO UPDATE SET credits_used = credit_usage_daily.credits_used + EXCLUDED.credits_used
        """,
        {"tid": tenant_id, "kind": agent_kind, "amt": amount},
    )
    return balance
