"""Hourly UTC generate tick: enqueue at most one draft job per tenant, then process.

Does not debit credits and does not publish to LinkedIn.
"""
from __future__ import annotations

import json
import logging
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

from sqlalchemy.exc import IntegrityError

from app.core.database import execute_one_raw, execute_raw
from app.services.billing import resolve_post_gen_plan
from app.services.generation import run_generation_pipeline

logger = logging.getLogger(__name__)

_SLOT_PRIORITY = ("daily_text", "daily_image", "weekly_image")
_AGENT_KIND = "post_gen"


def _as_utc(now_utc: datetime) -> datetime:
    if now_utc.tzinfo is None:
        return now_utc.replace(tzinfo=timezone.utc)
    return now_utc.astimezone(timezone.utc)


def _tick_at_iso(now_utc: datetime) -> str:
    truncated = _as_utc(now_utc).replace(minute=0, second=0, microsecond=0)
    return truncated.isoformat(timespec="seconds")


def _day_window(now_utc: datetime) -> Tuple[datetime, datetime, date]:
    start = _as_utc(now_utc).replace(hour=0, minute=0, second=0, microsecond=0)
    return start, start + timedelta(days=1), start.date()


def _week_window(now_utc: datetime) -> Tuple[datetime, datetime, date]:
    start_day = _as_utc(now_utc).replace(hour=0, minute=0, second=0, microsecond=0)
    monday = start_day - timedelta(days=start_day.weekday())
    return monday, monday + timedelta(days=7), monday.date()


def _window_for_slot(slot_kind: str, now_utc: datetime) -> Tuple[datetime, datetime, date]:
    if slot_kind == "weekly_image":
        return _week_window(now_utc)
    return _day_window(now_utc)


def _payload_dict(raw: Any) -> Dict[str, Any]:
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
        except (TypeError, ValueError):
            return {}
        return parsed if isinstance(parsed, dict) else {}
    return {}


async def _has_active_persona_topics(tenant_id: str) -> bool:
    """Same 404 condition as select_topic: replacement row + at least one active topic."""
    replaced = await execute_one_raw(
        "SELECT tenant_id FROM tenant_topic_replacements WHERE tenant_id = :tid",
        {"tid": tenant_id},
    )
    if not replaced:
        return False
    row = await execute_one_raw(
        "SELECT id FROM topics WHERE is_active = true AND tenant_id = :tid LIMIT 1",
        {"tid": tenant_id},
    )
    return bool(row)


async def _usage_used(tenant_id: str, slot_kind: str, period_start: date) -> int:
    row = await execute_one_raw(
        """
        SELECT used FROM subscription_quota_usage
        WHERE tenant_id = CAST(:tid AS uuid)
          AND agent_kind = CAST(:kind AS agent_kind)
          AND quota_slot = :slot
          AND period_start = CAST(:ps AS date)
        """,
        {"tid": tenant_id, "kind": _AGENT_KIND, "slot": slot_kind, "ps": period_start.isoformat()},
    )
    return int(row["used"]) if row else 0


async def _inflight_used(
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


async def _slot_used(tenant_id: str, slot_kind: str, now_utc: datetime) -> int:
    wstart, wend, period_start = _window_for_slot(slot_kind, now_utc)
    return await _usage_used(tenant_id, slot_kind, period_start) + await _inflight_used(
        tenant_id, slot_kind, wstart, wend
    )


async def _pick_slot(tenant_id: str, plan: Dict[str, Any], now_utc: datetime) -> Optional[str]:
    for slot_kind in _SLOT_PRIORITY:
        cap = int(plan[slot_kind])
        remaining = cap - await _slot_used(tenant_id, slot_kind, now_utc)
        if remaining > 0:
            return slot_kind
    return None


async def _hour_job_exists(tenant_id: str, tick_at: str) -> bool:
    row = await execute_one_raw(
        """
        SELECT id FROM jobs
        WHERE type = 'generate'
          AND payload->>'tick_at' = :tick_at
          AND (
            tenant_id = CAST(:tid AS uuid)
            OR payload->>'tenant_id' = :tid
          )
        LIMIT 1
        """,
        {"tid": tenant_id, "tick_at": tick_at},
    )
    return bool(row)


async def enqueue_due_generate_jobs(now_utc: datetime) -> int:
    tick_at = _tick_at_iso(now_utc)
    inserted = 0
    rows = await execute_raw(
        """
        SELECT tenant_id
        FROM agent_subscriptions
        WHERE agent_kind = CAST(:kind AS agent_kind)
          AND status IN ('active', 'trialing')
        """,
        {"kind": _AGENT_KIND},
    )
    for row in rows:
        tenant_id = str(row["tenant_id"])
        try:
            plan = await resolve_post_gen_plan(tenant_id)
            if plan is None:
                logger.info(
                    "[GenerateJob] Tenant %s has no resolvable post_gen plan — skip",
                    tenant_id,
                )
                continue
            if not await _has_active_persona_topics(tenant_id):
                logger.info(
                    "[GenerateJob] Tenant %s has no Active persona topics — skip",
                    tenant_id,
                )
                continue
            if await _hour_job_exists(tenant_id, tick_at):
                logger.info(
                    "[GenerateJob] Tenant %s already has a generate job for %s — skip",
                    tenant_id,
                    tick_at,
                )
                continue
            slot_kind = await _pick_slot(tenant_id, plan, now_utc)
            if slot_kind is None:
                logger.info(
                    "[GenerateJob] Tenant %s has no remaining quota slots — skip",
                    tenant_id,
                )
                continue
            payload = {
                "tenant_id": tenant_id,
                "agent_kind": _AGENT_KIND,
                "slot_kind": slot_kind,
                "plan_code": plan["code"],
                "tick_at": tick_at,
            }
            try:
                created = await execute_one_raw(
                    """
                    INSERT INTO jobs (type, status, payload, tenant_id, quota_slot)
                    VALUES (
                      CAST('generate' AS job_type),
                      CAST('pending' AS job_status),
                      CAST(:payload AS jsonb),
                      CAST(:tid AS uuid),
                      :slot
                    )
                    RETURNING id
                    """,
                    {
                        "payload": json.dumps(payload),
                        "tid": tenant_id,
                        "slot": slot_kind,
                    },
                )
            except IntegrityError:
                logger.info(
                    "[GenerateJob] Tenant %s generate job conflict (in-flight unique) — skip",
                    tenant_id,
                )
                continue
            if created:
                inserted += 1
                logger.info(
                    "[GenerateJob] Enqueued job %s tenant=%s slot=%s tick_at=%s",
                    created["id"],
                    tenant_id,
                    slot_kind,
                    tick_at,
                )
        except Exception as err:
            logger.error("[GenerateJob] Enqueue failed for tenant %s: %s", tenant_id, err)
    return inserted


async def process_pending_generate_jobs() -> None:
    pending = await execute_raw(
        """
        SELECT id, payload FROM jobs
        WHERE type = 'generate' AND status = 'pending'
        ORDER BY id
        """
    )
    for job in pending:
        job_id = int(job["id"])
        claimed = await execute_one_raw(
            """
            UPDATE jobs
            SET status = CAST('running' AS job_status), started_at = NOW()
            WHERE id = :id AND status = CAST('pending' AS job_status)
            RETURNING id
            """,
            {"id": job_id},
        )
        if not claimed:
            continue
        payload = _payload_dict(job.get("payload"))
        try:
            tenant_id = payload["tenant_id"]
            slot_kind = payload["slot_kind"]
            post = await run_generation_pipeline(
                tenant_id=tenant_id,
                skip_image=(slot_kind == "daily_text"),
                quota_slot=slot_kind,
            )
            await execute_raw(
                """
                UPDATE jobs
                SET status = CAST('completed' AS job_status),
                    result = CAST(:result AS jsonb),
                    completed_at = NOW(),
                    error_message = NULL
                WHERE id = :id
                """,
                {"id": job_id, "result": json.dumps({"post_id": int(post["id"])})},
            )
            logger.info(
                "[GenerateJob] Job %s completed post_id=%s tenant=%s slot=%s",
                job_id,
                post["id"],
                tenant_id,
                slot_kind,
            )
        except Exception as err:
            await execute_raw(
                """
                UPDATE jobs
                SET status = CAST('failed' AS job_status),
                    error_message = :err,
                    completed_at = NOW()
                WHERE id = :id
                """,
                {"id": job_id, "err": str(err)},
            )
            logger.error("[GenerateJob] Job %s failed: %s", job_id, err)


async def _fail_stale_running_generate_jobs() -> int:
    rows = await execute_raw(
        """
        UPDATE jobs
        SET status = CAST('failed' AS job_status),
            error_message = :err,
            completed_at = NOW()
        WHERE type = 'generate'
          AND status = CAST('running' AS job_status)
          AND started_at < NOW() - interval '55 minutes'
        RETURNING id
        """,
        {"err": "stale running generate job"},
    )
    if rows:
        logger.warning("[GenerateJob] Marked %s stale running generate job(s) failed", len(rows))
    return len(rows)


async def run_generate_tick() -> None:
    now_utc = datetime.now(timezone.utc)
    logger.info("[GenerateJob] Tick %s", now_utc.isoformat(timespec="seconds"))
    try:
        await _fail_stale_running_generate_jobs()
    except Exception as err:
        logger.error("[GenerateJob] Stale-running cleanup failed: %s", err)
    try:
        n = await enqueue_due_generate_jobs(now_utc)
        logger.info("[GenerateJob] Enqueued %s job(s)", n)
    except Exception as err:
        logger.error("[GenerateJob] Enqueue phase failed: %s", err)
    try:
        await process_pending_generate_jobs()
    except Exception as err:
        logger.error("[GenerateJob] Process phase failed: %s", err)
