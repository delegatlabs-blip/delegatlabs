"""Plan quota used vs remaining — same windows the hourly generate cron uses."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

from app.core.database import execute_one_raw
from app.services.billing import DEFAULT_AGENT_KIND, resolve_post_gen_plan

SLOT_PRIORITY = ("daily_text", "daily_image", "weekly_image")


def _as_utc(now_utc: datetime) -> datetime:
    if now_utc.tzinfo is None:
        return now_utc.replace(tzinfo=timezone.utc)
    return now_utc.astimezone(timezone.utc)


def _day_window(now_utc: datetime) -> Tuple[datetime, datetime, date]:
    start = _as_utc(now_utc).replace(hour=0, minute=0, second=0, microsecond=0)
    return start, start + timedelta(days=1), start.date()


def _week_window(now_utc: datetime) -> Tuple[datetime, datetime, date]:
    start_day = _as_utc(now_utc).replace(hour=0, minute=0, second=0, microsecond=0)
    monday = start_day - timedelta(days=start_day.weekday())
    return monday, monday + timedelta(days=7), monday.date()


def window_for_slot(slot_kind: str, now_utc: datetime) -> Tuple[datetime, datetime, date]:
    if slot_kind == "weekly_image":
        return _week_window(now_utc)
    return _day_window(now_utc)


async def usage_used(tenant_id: str, slot_kind: str, period_start: date) -> int:
    row = await execute_one_raw(
        """
        SELECT used FROM subscription_quota_usage
        WHERE tenant_id = CAST(:tid AS uuid)
          AND agent_kind = CAST(:kind AS agent_kind)
          AND quota_slot = :slot
          AND period_start = CAST(:ps AS date)
        """,
        {"tid": tenant_id, "kind": DEFAULT_AGENT_KIND, "slot": slot_kind, "ps": period_start.isoformat()},
    )
    return int(row["used"]) if row else 0


async def inflight_used(
    tenant_id: str, slot_kind: str, window_start: datetime, window_end: datetime
) -> int:
    row = await execute_one_raw(
        """
        SELECT COUNT(*) AS cnt
        FROM jobs
        WHERE type = 'generate'
          AND status IN ('pending', 'running')
          AND tenant_id = CAST(:tid AS uuid)
          AND payload->>'slot_kind' = :slot
          AND (payload->>'tick_at')::timestamptz >= CAST(:wstart AS timestamptz)
          AND (payload->>'tick_at')::timestamptz < CAST(:wend AS timestamptz)
        """,
        {
            "tid": tenant_id,
            "slot": slot_kind,
            "wstart": window_start.isoformat(),
            "wend": window_end.isoformat(),
        },
    )
    return int(row["cnt"]) if row else 0


async def slot_used(tenant_id: str, slot_kind: str, now_utc: datetime) -> int:
    wstart, wend, period_start = window_for_slot(slot_kind, now_utc)
    return await usage_used(tenant_id, slot_kind, period_start) + await inflight_used(
        tenant_id, slot_kind, wstart, wend
    )


async def quota_snapshot(
    tenant_id: str, now_utc: Optional[datetime] = None
) -> Dict[str, Any]:
    """Used / remaining per plan slot. Cron skips this tenant when has_remaining is false."""
    now = _as_utc(now_utc or datetime.now(timezone.utc))
    plan = await resolve_post_gen_plan(tenant_id)
    if plan is None:
        return {
            "plan": None,
            "slots": [],
            "has_remaining": False,
            "cron_would_skip": True,
            "reason": "no_active_plan",
            "as_of": now.isoformat(timespec="seconds"),
        }

    slots = []
    has_remaining = False
    for slot_kind in SLOT_PRIORITY:
        cap = int(plan[slot_kind])
        used = await slot_used(tenant_id, slot_kind, now)
        remaining = max(cap - used, 0)
        _wstart, _wend, period_start = window_for_slot(slot_kind, now)
        if remaining > 0:
            has_remaining = True
        slots.append(
            {
                "slot": slot_kind,
                "cap": cap,
                "used": used,
                "remaining": remaining,
                "period_start": period_start.isoformat(),
                "period": "week" if slot_kind == "weekly_image" else "day",
            }
        )

    return {
        "plan": plan,
        "slots": slots,
        "has_remaining": has_remaining,
        "cron_would_skip": not has_remaining,
        "reason": None if has_remaining else "quota_exhausted",
        "as_of": now.isoformat(timespec="seconds"),
    }
