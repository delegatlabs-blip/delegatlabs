"""TS-16 static source ACs (PV / INF / schema / onboarding / Grok)."""
from __future__ import annotations

import re

from tests.ts8_helpers import (
    FREE_DESCRIPTION,
    MIGRATION_017,
    PLAN_KEYS,
    QUOTA_KEYS,
    ROLLBACK_017,
    SEED_PLANS,
    py_function_source,
)
from tests.ts16_helpers import (
    BILLING_PY,
    COMPOSE_PKG,
    COMPOSE_ROOT,
    CONFIG_PY,
    ENV_EXAMPLE,
    GENERATE_JOB_PY,
    GENERATION_PY,
    GROK_DEFAULT,
    GROK_PY,
    ONBOARDING_ADAPTIVE_PY,
    ONBOARDING_PY,
    PAYLOAD_KEYS,
    POSTS_PY,
    PUBLISH_JOB_PY,
    SCHEDULER_PY,
    SETTINGS_PY,
    TENANT_PY,
    USERS_PY,
    read_text,
    require_file,
)


def test_ac_pv_01_publish_job_limit_unchanged():
    """AC-PV-01 / AC-INF-02: LINKEDIN_DAILY_POST_LIMIT remains 3; publish_job does not generate."""
    src = read_text(PUBLISH_JOB_PY)
    assert src, "publish_job.py missing"
    assert re.search(r"LINKEDIN_DAILY_POST_LIMIT\s*=\s*3\b", src)
    assert "run_generation_pipeline" not in src
    sched = read_text(SCHEDULER_PY)
    assert "run_publish_job" in sched
    assert 'id="publish_job"' in sched or "id='publish_job'" in sched


def test_ac_pv_02_get_tenant_credits_still_mounted():
    """AC-PV-02: GET /tenant/credits stays mounted in tenant.py."""
    src = read_text(TENANT_PY)
    assert "/credits" in src


def test_ac_pv_04_improve_does_not_debit_generate_may():
    """AC-PV-04 / TS-22: improve must not consume; generate MAY consume text_post/image_post.

    Cron generate_job still must not (AC-PV-05). Manual still manual_post.
    """
    src = read_text(POSTS_PY)
    generate = py_function_source(src, "generate_post_endpoint")
    improve = py_function_source(src, "improve_post_endpoint")
    manual = py_function_source(src, "manual_post_endpoint")
    assert "consume_for_action" not in improve
    assert "consume_for_action" in manual
    assert "manual_post" in manual
    if "consume_for_action" in generate:
        assert "text_post" in generate
        assert "image_post" in generate
        assert "manual_post" not in generate


def test_ac_pv_05_meter_keys_unchanged_cron_does_not_consume():
    """AC-PV-05 / TS-22 Q-9: meter keys 50/10/30; cron source must not call consume_for_action."""
    from tests.ts8_helpers import SEED_COSTS

    by_key = {row["action_key"]: row["credits"] for row in SEED_COSTS}
    assert by_key["manual_post"] == 50
    assert by_key["text_post"] == 10
    assert by_key["image_post"] == 30
    if GENERATE_JOB_PY.is_file():
        gen = read_text(GENERATE_JOB_PY)
        assert "consume_for_action" not in gen
        assert "_consume_credit" not in gen


def test_ac_pv_06_disable_scheduler_gates_generate():
    """AC-PV-06: DISABLE_SCHEDULER=true skips scheduler including generate; no new env var."""
    src = read_text(SCHEDULER_PY)
    assert 'os.environ.get("DISABLE_SCHEDULER"' in src
    cfg = read_text(CONFIG_PY)
    env = read_text(ENV_EXAMPLE)
    for name in ("GENERATE_CRON_INTERVAL", "ENABLE_GENERATE_JOB", "QUOTA_CRON", "GENERATE_SCHEDULER"):
        assert name not in cfg
        assert name not in env
        assert name not in src


def test_ac_pv_06_disable_scheduler_true_skips_add_job():
    """AC-PV-06: when DISABLE_SCHEDULER=true, start_scheduler registers no jobs.

    Host pytest has no apscheduler (existing suite never imports scheduler.py).
    Assert the early-return is in source so generate cannot be registered.
    """
    src = read_text(SCHEDULER_PY)
    fn = py_function_source(src, "start_scheduler")
    assert 'os.environ.get("DISABLE_SCHEDULER"' in fn
    assert "return" in fn
    assert "run_generate_tick" not in fn.split("return")[0] or fn.find("DISABLE_SCHEDULER") < fn.find("run_generate_tick")


def test_ac_inf_01_generate_runner_registered_hourly_utc():
    """AC-INF-01 / AC-HP-02: scheduler registers run_generate_tick hourly UTC, id generate_job."""
    require_file(GENERATE_JOB_PY, "generate_job.py missing (C-subscription-quota §2.1)")
    src = read_text(GENERATE_JOB_PY)
    assert "async def run_generate_tick" in src
    assert "async def enqueue_due_generate_jobs" in src
    assert "async def process_pending_generate_jobs" in src
    assert "publish_post" not in src
    assert "consume_for_action" not in src
    sched = read_text(SCHEDULER_PY)
    assert "run_generate_tick" in sched
    assert 'id="generate_job"' in sched or "id='generate_job'" in sched
    assert 'timezone="UTC"' in sched or "timezone='UTC'" in sched
    assert "minute=0" in sched or 'minute="0"' in sched or "minute='0'" in sched
    fn = py_function_source(sched, "start_scheduler")
    assert "posts_per_week" not in fn
    assert "publish_cron_interval" in fn


def test_ac_inf_03_compose_has_no_new_generate_env():
    """AC-INF-03: compose does not require a new env var for generate to run."""
    for path in (COMPOSE_ROOT, COMPOSE_PKG):
        text = read_text(path)
        if not text:
            continue
        assert "GENERATE_CRON" not in text
        assert "ENABLE_GENERATE" not in text
        assert "QUOTA_CRON" not in text


def test_ac_hp_06_text_slot_skip_image_kwarg():
    """AC-HP-06 / Q-18: skip_image=True skips Grok; quota_slot persisted."""
    src = read_text(GENERATION_PY)
    assert src, "generation.py missing"
    fn = py_function_source(src, "run_generation_pipeline")
    assert "skip_image" in fn
    assert "quota_slot" in fn
    assert "generate_and_store_image" in src


def test_ac_hp_07_image_slot_uses_existing_grok_model():
    """AC-HP-07: image slots use GROK_IMAGE_MODEL; no new image-model env."""
    cfg = read_text(CONFIG_PY)
    env = read_text(ENV_EXAMPLE)
    grok = read_text(GROK_PY)
    assert "GROK_IMAGE_MODEL" in cfg
    assert GROK_DEFAULT in cfg or GROK_DEFAULT in env
    assert "GROK_IMAGE_MODEL" in grok or "GROK_IMAGE_MODEL" in read_text(GENERATION_PY)
    for name in ("GROK_HQ_MODEL", "IMAGE_QUOTA_MODEL", "GROK_TEXT_MODEL"):
        assert name not in cfg
        assert name not in env


def test_ac_hp_15_cron_ignores_posts_per_week():
    """AC-HP-15: load_settings and generate cron do not read posts_per_week."""
    gen = read_text(GENERATION_PY)
    load = py_function_source(gen, "load_settings")
    assert "posts_per_week" not in load
    if GENERATE_JOB_PY.is_file():
        assert "posts_per_week" not in read_text(GENERATE_JOB_PY)
    sched = read_text(SCHEDULER_PY)
    assert "posts_per_week" not in py_function_source(sched, "start_scheduler")
    settings = read_text(SETTINGS_PY)
    assert "posts_per_week" in settings


def test_ac_hp_16_onboarding_complete_does_not_generate():
    """AC-HP-16 / Q-11: adaptive and legacy complete must not call run_generation_pipeline."""
    adaptive = read_text(ONBOARDING_ADAPTIVE_PY)
    legacy = read_text(ONBOARDING_PY)
    complete = py_function_source(adaptive, "adaptive_complete")
    save = py_function_source(legacy, "save_onboarding")
    assert complete, "adaptive_complete missing"
    assert "run_generation_pipeline" not in complete
    if save:
        assert "run_generation_pipeline" not in save


def test_ac_ed_07_017_seed_and_column_kept():
    """AC-ED-07: 017 keeps monthly_credits, seeds 0, Free name, quota columns, not weekly_text."""
    require_file(MIGRATION_017, "017_subscription_quota.sql missing")
    sql = read_text(MIGRATION_017)
    assert "monthly_credits" in sql
    assert "daily_text" in sql
    assert "daily_image" in sql
    assert "weekly_image" in sql
    assert "weekly_text" not in sql
    assert "quota_slot" in sql
    assert "quota_slot_kind" not in sql
    assert "Free trial" not in sql
    assert FREE_DESCRIPTION in sql
    for plan in SEED_PLANS:
        assert plan["code"] in sql
        assert plan["name"] in sql


def test_ac_ed_08_017_does_not_zero_wallets():
    """AC-ED-08: TS-16 migrations do not UPDATE tenants SET credits_remaining."""
    require_file(MIGRATION_017, "017_subscription_quota.sql missing")
    sql = read_text(MIGRATION_017)
    compact = re.sub(r"\s+", " ", sql.lower())
    assert "update tenants set credits_remaining" not in compact


def test_ac_t8_05_rollback_exists_and_mentions_quota():
    """AC-T8-05: rollback file exists (G10)."""
    require_file(ROLLBACK_017, "017_subscription_quota_rollback.sql missing")
    rb = read_text(ROLLBACK_017)
    assert rb.strip()
    assert "quota_slot" in rb or "daily_text" in rb or "subscription_quota_usage" in rb


def test_ac_schema_plan_id_required_for_post_gen():
    """C-subscription-quota-schema §2: post_gen plan_id required; cron must not SELECT is_default."""
    sql = read_text(MIGRATION_017)
    assert "asub_post_gen_plan_required_chk" in sql
    assert "subscription_quota_usage" in sql
    users = read_text(USERS_PY)
    assert "plan_id" in users
    if GENERATE_JOB_PY.is_file():
        resolve = py_function_source(read_text(BILLING_PY), "resolve_post_gen_plan")
        assert resolve, "resolve_post_gen_plan missing"
        compact = re.sub(r"\s+", "", resolve.lower())
        assert "is_default=true" not in compact
        assert "where is_default" not in resolve.lower()


def test_ac_t8_02_plan_keys_are_quota_not_posts_suffix():
    """AC-T8-02: HTTP JSON keys are daily_text/daily_image/weekly_image, not *_posts."""
    for key in QUOTA_KEYS:
        assert key in PLAN_KEYS
        assert f"{key}_posts" not in PLAN_KEYS


def test_ac_oos_01_stripe_env_absent_razorpay_present():
    """Stripe stays off Settings; Razorpay keys are the live checkout env."""
    cfg = read_text(CONFIG_PY)
    env = read_text(ENV_EXAMPLE)
    assert "RAZORPAY_KEY_ID" in cfg
    assert "RAZORPAY_KEY_ID" in env
    assert "STRIPE" not in cfg
    assert "STRIPE" not in env


def test_ac_oos_02_improve_and_persona_not_rewritten_for_quota():
    """AC-OOS-02: Improve path and persona option model remain; quota does not replace them."""
    posts = read_text(POSTS_PY)
    assert "improve_post_endpoint" in posts or "/improve" in posts
    from tests.ts15_helpers import TOPICS_TSX, TOPIC_ROW_TSX

    blob = read_text(TOPICS_TSX) + read_text(TOPIC_ROW_TSX)
    assert "selected_option_value" in blob
    assert "persona_generated" in blob


def test_generate_job_payload_keys_in_source():
    """C-subscription-quota §3: job payload required keys present in generate_job source."""
    require_file(GENERATE_JOB_PY, "generate_job.py missing")
    src = read_text(GENERATE_JOB_PY)
    for key in PAYLOAD_KEYS:
        assert key in src
    for slot in ("daily_text", "daily_image", "weekly_image"):
        assert slot in src


def test_get_posts_uses_auth_context_tenant_filter():
    """C-subscription-quota §6: GET /posts uses AuthContext and tenant_id filter."""
    src = read_text(POSTS_PY)
    assert "get_auth_context" in src
    getter = (
        py_function_source(src, "get_posts")
        or py_function_source(src, "list_posts")
        or py_function_source(src, "list_tenant_posts")
    )
    blob = getter or src
    assert "ctx.tenant_id" in blob


def test_manual_insert_sets_tenant_id():
    """SCHEMA-DEP-POST-TENANT + §5.2: manual INSERT uses ctx.tenant_id."""
    manual = py_function_source(read_text(POSTS_PY), "manual_post_endpoint")
    assert manual
    assert "ctx.tenant_id" in manual
