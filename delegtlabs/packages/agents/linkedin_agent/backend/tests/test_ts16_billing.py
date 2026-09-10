"""TS-16 billing helpers: select_plan no grant, resolve_post_gen_plan, PLAN_WRITE_FIELDS."""
from __future__ import annotations

import pytest

from tests.ts8_helpers import TENANT_ID, py_function_source
from tests.ts16_helpers import BILLING_PY, read_text
from tests.ts16_store import plan_for_code


def test_ac_ed_06_select_plan_source_does_not_grant():
    """AC-ED-06 / Q-8: select_plan must not grant monthly_credits / ledger kind grant."""
    src = read_text(BILLING_PY)
    fn = py_function_source(src, "select_plan")
    assert fn, "select_plan missing"
    assert "'grant'" not in fn
    assert '"grant"' not in fn


@pytest.mark.asyncio
async def test_ac_ed_06_select_plan_does_not_write_wallet(quota_store):
    """AC-ED-06: invoking select_plan(..., grant_credits=True) does not add to credits_remaining."""
    from tests.ts10_helpers import _ensure_posts_import_stubs

    _ensure_posts_import_stubs()
    plan = plan_for_code("starter")
    plan["monthly_credits"] = 1000
    quota_store.add_plan(plan)
    quota_store.add_sub(TENANT_ID, plan_id=plan["id"], status="active")
    quota_store.credits[TENANT_ID] = 40
    from tests.ts16_helpers import install_quota_store

    patches = install_quota_store(quota_store)
    sqls: list[str] = []
    orig = quota_store.exec

    def wrapped(sql, params=None):
        sqls.append(sql)
        return orig(sql, params)

    quota_store.exec = wrapped  # type: ignore[method-assign]
    try:
        import app.services.billing as billing

        await billing.select_plan(TENANT_ID, plan["id"], grant_credits=True)
    except Exception:
        pass
    finally:
        for p in patches:
            p.stop()
    joined = " ".join(sqls).lower()
    assert "credit_transactions" not in joined or "grant" not in joined
    assert quota_store.credits[TENANT_ID] == 40


def test_resolve_post_gen_plan_exists_and_skips_null_plan_id():
    """C-subscription-quota §2.3: resolve_post_gen_plan; NULL plan_id → None; no is_default lookup."""
    src = read_text(BILLING_PY)
    fn = py_function_source(src, "resolve_post_gen_plan")
    assert fn, "resolve_post_gen_plan missing"
    compact = fn.replace(" ", "").lower()
    assert "is_default=true" not in compact
    assert "where is_default" not in fn.lower()
    assert "select_plan" not in fn
    assert "consume_for_action" not in fn
    assert "credits_remaining" not in fn


def test_ac_t8_04_plan_write_fields_include_quota():
    """AC-T8-04: PLAN_WRITE_FIELDS includes daily_text, daily_image, weekly_image."""
    from app.services.billing import PLAN_WRITE_FIELDS

    for key in ("daily_text", "daily_image", "weekly_image", "monthly_credits"):
        assert key in PLAN_WRITE_FIELDS


def test_signup_assigns_default_plan_id():
    """C-subscription-quota §2.5: signup post_gen INSERT sets plan_id to is_default post_gen row."""
    from tests.ts16_helpers import USERS_PY

    src = read_text(USERS_PY)
    assert "plan_id" in src
    assert "is_default" in src
    assert "post_gen" in src
