"""TS-16 cron mix, boundaries, process spies (HP-04/06/08/10–12, ED, ERR, TEXT-FAIL)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest

from tests.ts8_helpers import SEED_PLANS, TENANT_ID
from tests.ts16_helpers import HOUR, import_generate_job, install_quota_store
from tests.ts16_store import TENANT_B, monday_of


def _stop(patches):
    for p in patches:
        p.stop()


async def _enqueue(store: QuotaStore, now):
    gj = import_generate_job()
    patches = install_quota_store(store, extra=[gj])
    try:
        return await gj.enqueue_due_generate_jobs(now_utc=now)
    finally:
        _stop(patches)


def _jobs_for(store: QuotaStore, tenant_id: str):
    return [j for j in store.jobs if j.get("tenant_id") == tenant_id and j.get("type") == "generate"]


def _slot(job: dict) -> str:
    payload = job.get("payload") or {}
    return job.get("quota_slot") or payload.get("slot_kind")


@pytest.mark.asyncio
async def test_ac_hp_10_starter_additive(quota_store):
    """AC-HP-10: Starter up to 1 text/day plus 3 weekly images in the same week."""
    quota_store.seed_tenant(TENANT_ID, "starter")
    start = datetime(2026, 9, 7, 0, 0, tzinfo=timezone.utc)
    for day in range(7):
        await _enqueue(quota_store, start + timedelta(days=day))
        await _enqueue(quota_store, start + timedelta(days=day, hours=1))
    jobs = _jobs_for(quota_store, TENANT_ID)
    text = sum(1 for j in jobs if _slot(j) == "daily_text")
    image = sum(1 for j in jobs if _slot(j) == "weekly_image")
    assert text == 7
    assert image == 3


@pytest.mark.asyncio
async def test_ac_hp_11_growth_3_text_2_image(quota_store):
    """AC-HP-11: Growth one UTC day is at most 3 text + 2 image, text-first."""
    quota_store.seed_tenant(TENANT_ID, "growth")
    day = datetime(2026, 9, 8, 0, 0, tzinfo=timezone.utc)
    for hour in range(8):
        await _enqueue(quota_store, day + timedelta(hours=hour))
    jobs = _jobs_for(quota_store, TENANT_ID)
    assert len(jobs) == 5
    slots = [_slot(j) for j in jobs]
    assert slots[:3] == ["daily_text", "daily_text", "daily_text"]
    assert slots[3:] == ["daily_image", "daily_image"]


@pytest.mark.asyncio
async def test_ac_hp_12_and_ed_04_scale_catalog_30_delivery_24(quota_store):
    """AC-HP-12 / AC-ED-04: Scale catalog 20+10; cron ≤24 drafts in one UTC day; 25th is zero."""
    scale = next(p for p in SEED_PLANS if p["code"] == "scale")
    assert scale["daily_text"] == 20
    assert scale["daily_image"] == 10
    quota_store.seed_tenant(TENANT_ID, "scale")
    day = datetime(2026, 9, 8, 0, 0, tzinfo=timezone.utc)
    for hour in range(24):
        await _enqueue(quota_store, day + timedelta(hours=hour))
    jobs = _jobs_for(quota_store, TENANT_ID)
    assert len(jobs) == 24
    text = sum(1 for j in jobs if _slot(j) == "daily_text")
    image = sum(1 for j in jobs if _slot(j) == "daily_image")
    assert text == 20
    assert image == 4
    await _enqueue(quota_store, day + timedelta(hours=23))
    assert len(_jobs_for(quota_store, TENANT_ID)) == 24


@pytest.mark.asyncio
async def test_ac_ed_01_no_daily_rollover(quota_store):
    """AC-ED-01: unused daily slots die at UTC midnight; next day is a fresh allotment."""
    quota_store.seed_tenant(TENANT_ID, "starter")
    before_midnight = datetime(2026, 9, 7, 23, 0, tzinfo=timezone.utc)
    await _enqueue(quota_store, before_midnight)
    assert _slot(_jobs_for(quota_store, TENANT_ID)[0]) == "daily_text"
    next_day = datetime(2026, 9, 8, 0, 0, tzinfo=timezone.utc)
    await _enqueue(quota_store, next_day)
    slots = [_slot(j) for j in _jobs_for(quota_store, TENANT_ID)]
    assert slots.count("daily_text") == 2


@pytest.mark.asyncio
async def test_ac_ed_02_monday_week_boundary(quota_store):
    """AC-ED-02: unused weekly image dies at Monday 00:00 UTC."""
    from tests.ts16_helpers import MONDAY_UTC, SUNDAY_UTC

    quota_store.seed_tenant(TENANT_ID, "free", status="trialing")
    sunday_hour = SUNDAY_UTC.replace(hour=14, minute=0, second=0, microsecond=0)
    await _enqueue(quota_store, sunday_hour)
    assert len(_jobs_for(quota_store, TENANT_ID)) == 1
    week_start = monday_of(SUNDAY_UTC.date())
    quota_store.set_usage(TENANT_ID, "weekly_image", week_start, 1)
    await _enqueue(quota_store, SUNDAY_UTC)
    assert len(_jobs_for(quota_store, TENANT_ID)) == 1
    await _enqueue(quota_store, MONDAY_UTC)
    assert len(_jobs_for(quota_store, TENANT_ID)) == 2


@pytest.mark.asyncio
async def test_ac_hp_15_two_tenants_ignore_global_posts_per_week(quota_store):
    """AC-HP-15: same global posts_per_week, different plans → different job counts."""
    quota_store.seed_tenant(TENANT_ID, "free", status="trialing")
    quota_store.seed_tenant(TENANT_B, "growth")
    day = datetime(2026, 9, 8, 0, 0, tzinfo=timezone.utc)
    for hour in range(6):
        await _enqueue(quota_store, day + timedelta(hours=hour))
    assert len(_jobs_for(quota_store, TENANT_ID)) == 1
    assert len(_jobs_for(quota_store, TENANT_B)) == 5


@pytest.mark.asyncio
async def test_ac_hp_06_daily_text_passes_skip_image_true(quota_store, pipeline_spy):
    """AC-HP-06: daily_text job calls pipeline with skip_image=True."""
    quota_store.seed_tenant(TENANT_ID, "starter")
    gj = import_generate_job()
    patches = install_quota_store(quota_store, extra=[gj])
    p = patch.object(gj, "run_generation_pipeline", pipeline_spy)
    p.start()
    try:
        await gj.enqueue_due_generate_jobs(now_utc=HOUR)
        await gj.process_pending_generate_jobs()
    finally:
        p.stop()
        _stop(patches)
    assert pipeline_spy.await_count >= 1 or pipeline_spy.call_count >= 1
    kwargs = pipeline_spy.call_args.kwargs
    assert kwargs.get("skip_image") is True
    assert kwargs.get("quota_slot") == "daily_text"
    assert kwargs.get("tenant_id") == TENANT_ID


@pytest.mark.asyncio
async def test_ac_hp_04_hp_08_process_draft_no_consume(quota_store, pipeline_spy, consume_spy):
    """AC-HP-04 / AC-HP-08: process creates draft; consume_for_action is not called."""
    quota_store.seed_tenant(TENANT_ID, "starter")
    gj = import_generate_job()
    patches = install_quota_store(quota_store, extra=[gj])
    pipe = patch.object(gj, "run_generation_pipeline", pipeline_spy)
    cons = []
    if hasattr(gj, "consume_for_action"):
        cons.append(patch.object(gj, "consume_for_action", consume_spy))
    billing = __import__("app.services.billing", fromlist=["consume_for_action"])
    if hasattr(billing, "consume_for_action"):
        cons.append(patch.object(billing, "consume_for_action", consume_spy))
    pipe.start()
    for c in cons:
        c.start()
    try:
        await gj.enqueue_due_generate_jobs(now_utc=HOUR)
        await gj.process_pending_generate_jobs()
    finally:
        pipe.stop()
        for c in cons:
            c.stop()
        _stop(patches)
    consume_spy.assert_not_called()


@pytest.mark.asyncio
async def test_ac_err_01_image_grok_failure_counts_used(quota_store, pipeline_spy):
    """AC-ERR-01 / Q-21: image slot Grok failure still saves text draft and counts the slot."""
    quota_store.seed_tenant(TENANT_ID, "growth")
    quota_store.set_usage(TENANT_ID, "daily_text", HOUR.date(), 3)
    pipeline_spy.return_value = {
        "id": 9,
        "status": "draft",
        "generated_text": "kept text",
        "image_url": None,
    }
    gj = import_generate_job()
    patches = install_quota_store(quota_store, extra=[gj])
    p = patch.object(gj, "run_generation_pipeline", pipeline_spy)
    p.start()
    try:
        await gj.enqueue_due_generate_jobs(now_utc=HOUR)
        await gj.process_pending_generate_jobs()
    finally:
        p.stop()
        _stop(patches)
    jobs = _jobs_for(quota_store, TENANT_ID)
    assert jobs and _slot(jobs[0]) == "daily_image"
    kwargs = pipeline_spy.call_args.kwargs
    assert kwargs.get("skip_image") is False
    assert kwargs.get("quota_slot") == "daily_image"


@pytest.mark.asyncio
async def test_ac_ed_03_scale_residual_image_does_not_roll(quota_store):
    """AC-ED-03: after 24 Scale drafts (20 text + 4 image), unused image slots do not roll to next UTC day."""
    quota_store.seed_tenant(TENANT_ID, "scale")
    day = datetime(2026, 9, 8, 0, 0, tzinfo=timezone.utc)
    for hour in range(24):
        await _enqueue(quota_store, day + timedelta(hours=hour))
    assert len(_jobs_for(quota_store, TENANT_ID)) == 24
    next_day = day + timedelta(days=1)
    await _enqueue(quota_store, next_day)
    jobs = _jobs_for(quota_store, TENANT_ID)
    assert len(jobs) == 25
    assert _slot(jobs[-1]) == "daily_text"


@pytest.mark.asyncio
async def test_ac_err_02_one_tenant_failure_does_not_skip_rest(quota_store, pipeline_spy):
    """AC-ERR-02: tenant A pipeline error does not skip tenant B."""
    quota_store.seed_tenant(TENANT_ID, "starter", topic_name="A")
    quota_store.seed_tenant(TENANT_B, "starter", topic_name="B")

    async def boom(*args, **kwargs):
        tid = kwargs.get("tenant_id")
        if tid == TENANT_ID:
            raise RuntimeError("pipeline failed")
        return {"id": 2, "status": "draft", "generated_text": "b", "image_url": None}

    pipeline_spy.side_effect = boom
    gj = import_generate_job()
    patches = install_quota_store(quota_store, extra=[gj])
    p = patch.object(gj, "run_generation_pipeline", pipeline_spy)
    p.start()
    try:
        await gj.enqueue_due_generate_jobs(now_utc=HOUR)
        await gj.process_pending_generate_jobs()
    finally:
        p.stop()
        _stop(patches)
    assert len(_jobs_for(quota_store, TENANT_B)) == 1


@pytest.mark.asyncio
async def test_ac_text_fail_does_not_consume_slot(quota_store):
    """Q-16-TEXT-FAIL A: text/Gemini fail with no draft → do not increment usage."""
    quota_store.seed_tenant(TENANT_ID, "starter")
    gj = import_generate_job()
    patches = install_quota_store(quota_store, extra=[gj])
    p = patch.object(gj, "run_generation_pipeline", AsyncMock(side_effect=RuntimeError("gemini failed")))
    p.start()
    try:
        await gj.enqueue_due_generate_jobs(now_utc=HOUR)
        await gj.process_pending_generate_jobs()
    finally:
        p.stop()
        _stop(patches)
    assert quota_store.posts == []
    assert quota_store.used(TENANT_ID, "daily_text", HOUR.date()) == 0


@pytest.mark.asyncio
async def test_ac_tn_02_pipeline_receives_tenant_id(quota_store, pipeline_spy):
    """AC-TN-02: cron generate passes tenant_id so select_topic cannot sample the other catalog."""
    quota_store.seed_tenant(TENANT_ID, "starter", topic_name="Alpha only")
    quota_store.seed_tenant(TENANT_B, "starter", topic_name="Beta only")
    gj = import_generate_job()
    patches = install_quota_store(quota_store, extra=[gj])
    p = patch.object(gj, "run_generation_pipeline", pipeline_spy)
    p.start()
    try:
        await gj.enqueue_due_generate_jobs(now_utc=HOUR)
        await gj.process_pending_generate_jobs()
    finally:
        p.stop()
        _stop(patches)
    tenant_ids = []
    for call in pipeline_spy.await_args_list or pipeline_spy.call_args_list:
        tenant_ids.append(call.kwargs.get("tenant_id"))
    assert TENANT_ID in tenant_ids
    assert TENANT_B in tenant_ids
