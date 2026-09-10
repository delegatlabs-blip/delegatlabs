"""TS-16 cron enqueue ACs (HP-02/03/05/09–12, EM, NEG, TN, week/day caps)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from tests.ts8_helpers import TENANT_ID
from tests.ts16_helpers import HOUR, MONDAY_UTC, SUNDAY_UTC, attach_log_capture, import_generate_job, install_quota_store
from tests.ts16_store import TENANT_B, QuotaStore, monday_of


def _stop(patches):
    for p in patches:
        p.stop()


async def _enqueue(store: QuotaStore, now):
    gj = import_generate_job()
    patches = install_quota_store(store, extra=[gj])
    try:
        count = await gj.enqueue_due_generate_jobs(now_utc=now)
        return count, gj
    finally:
        _stop(patches)


def _jobs_for(store: QuotaStore, tenant_id: str):
    return [j for j in store.jobs if j.get("tenant_id") == tenant_id and j.get("type") == "generate"]


def _slot(job: dict) -> str:
    payload = job.get("payload") or {}
    return job.get("quota_slot") or payload.get("slot_kind")


@pytest.mark.asyncio
async def test_ac_hp_02_enqueue_creates_generate_job_payload(quota_store):
    """AC-HP-02: one tick inserts jobs type=generate with required payload keys; UTC now_utc."""
    quota_store.seed_tenant(TENANT_ID, "starter")
    count, _gj = await _enqueue(quota_store, HOUR)
    assert count >= 1
    jobs = _jobs_for(quota_store, TENANT_ID)
    assert len(jobs) == 1
    payload = jobs[0]["payload"] or {}
    for key in ("tenant_id", "agent_kind", "slot_kind", "plan_code", "tick_at"):
        assert key in payload
    assert payload["tenant_id"] == TENANT_ID
    assert payload["agent_kind"] == "post_gen"
    assert payload["plan_code"] == "starter"
    assert payload["slot_kind"] in ("daily_text", "daily_image", "weekly_image")
    assert "+00:00" in str(payload["tick_at"]) or str(payload["tick_at"]).endswith("Z")


@pytest.mark.asyncio
async def test_ac_hp_03_at_most_one_job_per_tenant_per_tick(quota_store):
    """AC-HP-03 / Q-16: Growth with daily text and daily image remaining still gets one job."""
    quota_store.seed_tenant(TENANT_ID, "growth")
    await _enqueue(quota_store, HOUR)
    assert len(_jobs_for(quota_store, TENANT_ID)) == 1


@pytest.mark.asyncio
async def test_ac_hp_05_priority_daily_text_then_image_then_weekly(quota_store):
    """AC-HP-05 / Q-2c: daily_text > daily_image > weekly_image."""
    quota_store.seed_tenant(TENANT_ID, "starter")
    await _enqueue(quota_store, HOUR)
    assert _slot(_jobs_for(quota_store, TENANT_ID)[0]) == "daily_text"

    store2 = QuotaStore()
    store2.seed_tenant(TENANT_ID, "growth")
    store2.set_usage(TENANT_ID, "daily_text", HOUR.date(), used=3)
    await _enqueue(store2, HOUR)
    assert _slot(_jobs_for(store2, TENANT_ID)[0]) == "daily_image"

    store3 = QuotaStore()
    store3.seed_tenant(TENANT_ID, "starter")
    store3.set_usage(TENANT_ID, "daily_text", HOUR.date(), used=1)
    await _enqueue(store3, HOUR)
    assert _slot(_jobs_for(store3, TENANT_ID)[0]) == "weekly_image"


@pytest.mark.asyncio
async def test_ac_hp_09_free_trialing_gets_weekly_image(quota_store):
    """AC-HP-09: Free trialing with unused weekly image gets one image-slot job that week."""
    quota_store.seed_tenant(TENANT_ID, "free", status="trialing")
    await _enqueue(quota_store, HOUR)
    jobs = _jobs_for(quota_store, TENANT_ID)
    assert len(jobs) == 1
    assert _slot(jobs[0]) == "weekly_image"
    await _enqueue(quota_store, HOUR + timedelta(hours=1))
    assert len(_jobs_for(quota_store, TENANT_ID)) == 1


@pytest.mark.asyncio
async def test_ac_em_01_no_eligible_tenants(quota_store):
    """AC-EM-01: empty eligibility creates zero generate jobs."""
    count, _ = await _enqueue(quota_store, HOUR)
    assert count == 0
    assert quota_store.jobs == []


@pytest.mark.asyncio
async def test_ac_em_02_no_remaining_slots(quota_store):
    """AC-EM-02: Growth after daily caps used → zero jobs this tick."""
    quota_store.seed_tenant(TENANT_ID, "growth")
    quota_store.set_usage(TENANT_ID, "daily_text", HOUR.date(), 3)
    quota_store.set_usage(TENANT_ID, "daily_image", HOUR.date(), 2)
    count, _ = await _enqueue(quota_store, HOUR)
    assert len(_jobs_for(quota_store, TENANT_ID)) == 0
    assert count == 0


@pytest.mark.asyncio
async def test_ac_em_03_zero_active_topics_skip_log(quota_store):
    """AC-EM-03 / Q-20: no Active persona topics → log + zero drafts; other tenant still processed."""
    quota_store.seed_tenant(TENANT_ID, "starter", with_topic=False)
    quota_store.seed_tenant(TENANT_B, "starter", with_topic=True, topic_name="B topic")
    log, handler, records = attach_log_capture()
    try:
        await _enqueue(quota_store, HOUR)
    finally:
        log.removeHandler(handler)
    assert _jobs_for(quota_store, TENANT_ID) == []
    assert len(_jobs_for(quota_store, TENANT_B)) == 1
    assert records, "Q-20 skip must emit a log record"


@pytest.mark.asyncio
async def test_ac_neg_01_paused_not_eligible(quota_store):
    """AC-NEG-01: paused post_gen gets zero jobs; active sibling still does."""
    quota_store.seed_tenant(TENANT_ID, "starter", status="paused")
    quota_store.seed_tenant(TENANT_B, "starter", status="active")
    await _enqueue(quota_store, HOUR)
    assert _jobs_for(quota_store, TENANT_ID) == []
    assert len(_jobs_for(quota_store, TENANT_B)) == 1


@pytest.mark.asyncio
async def test_ac_neg_02_non_post_gen_ignored(quota_store):
    """AC-NEG-02: lead_gen active + post_gen cancelled → 0 drafts."""
    plan = quota_store.seed_tenant(TENANT_ID, "starter", status="cancelled", with_topic=True)
    quota_store.add_sub(TENANT_ID, plan_id=plan["id"], status="active", agent_kind="lead_gen")
    await _enqueue(quota_store, HOUR)
    assert _jobs_for(quota_store, TENANT_ID) == []


@pytest.mark.asyncio
async def test_ac_tn_01_quota_remaining_per_tenant(quota_store):
    """AC-TN-01 / AC-TN-04: A and B each get one job; remaining is independent."""
    quota_store.seed_tenant(TENANT_ID, "starter", topic_name="A topic")
    quota_store.seed_tenant(TENANT_B, "starter", topic_name="B topic")
    await _enqueue(quota_store, HOUR)
    assert len(_jobs_for(quota_store, TENANT_ID)) == 1
    assert len(_jobs_for(quota_store, TENANT_B)) == 1
    assert _jobs_for(quota_store, TENANT_ID)[0]["payload"]["tenant_id"] == TENANT_ID
    assert _jobs_for(quota_store, TENANT_B)[0]["payload"]["tenant_id"] == TENANT_B


@pytest.mark.asyncio
async def test_ac_same_hour_no_second_attempt(quota_store):
    """C-subscription-quota §4.6: same (tenant_id, tick_at) must not insert a second job."""
    quota_store.seed_tenant(TENANT_ID, "starter")
    await _enqueue(quota_store, HOUR)
    await _enqueue(quota_store, HOUR)
    assert len(_jobs_for(quota_store, TENANT_ID)) == 1


@pytest.mark.asyncio
async def test_ac_ed_10_quota_is_one_pool_per_tenant(quota_store):
    """AC-ED-10: two destinations on one tenant share one remaining-slot pool."""
    quota_store.seed_tenant(TENANT_ID, "free", status="trialing")
    quota_store.destinations = [
        {"id": "d1", "tenant_id": TENANT_ID},
        {"id": "d2", "tenant_id": TENANT_ID},
    ]
    await _enqueue(quota_store, HOUR)
    assert len(_jobs_for(quota_store, TENANT_ID)) == 1
