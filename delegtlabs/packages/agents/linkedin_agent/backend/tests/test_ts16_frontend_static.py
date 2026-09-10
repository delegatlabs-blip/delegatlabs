"""TS-16 USER/Admin UI source ACs (no Jest)."""
from __future__ import annotations

from tests.ts8_helpers import EMPTY_PLANS, NOOP_TOAST, QUOTA_KEYS
from tests.ts16_helpers import (
    API_INDEX,
    BILLING_TSX,
    CATALOG_LOAD_ERR,
    COPY_GENERATE,
    CREDITS_TAB,
    SUBSCRIPTION_TAB,
    SUMMARY_CARD,
    TARGET_PPW,
    TOPICS_TSX,
    glob_text,
    read_text,
)


def test_ac_hp_01_subscription_tab_quota_copy_not_credits_month():
    """AC-HP-01: Subscription cards are quota mix, not N credits / month."""
    sub = read_text(SUBSCRIPTION_TAB)
    assert sub, "SubscriptionTab.tsx missing"
    assert "credits / month" not in sub
    assert "credits/month" not in sub
    assert "{plan.monthly_credits}" not in sub
    for key in QUOTA_KEYS:
        assert key in sub
        assert f"{key}_posts" not in sub
    assert "Free trial" not in sub
    assert "up to 24 per UTC day" in sub


def test_ac_pv_03_upgrade_starts_checkout():
    """Upgrade starts checkout rather than the old catalog no-op toast."""
    sub = read_text(SUBSCRIPTION_TAB)
    assert "useBillingCheckout" in sub
    assert NOOP_TOAST not in sub


def test_ac_pv_02_credits_tab_still_loads_catalog_and_balance():
    """AC-PV-02: Credits tab still loads catalog packs + balance."""
    cred = read_text(CREDITS_TAB)
    assert cred, "CreditsTab.tsx missing"
    assert "catalog" in cred.lower() or "tenantApi" in cred
    assert "balance" in cred
    assert "Purchase" in cred
    assert NOOP_TOAST not in cred


def test_ac_em_04_empty_catalog_copy_unchanged():
    """AC-EM-04: zero plans still shows No plans yet."""
    sub = read_text(SUBSCRIPTION_TAB)
    assert EMPTY_PLANS in sub


def test_ac_err_03_catalog_get_error_copy():
    """AC-ERR-03: Subscription tab error uses Could not load plans."""
    sub = read_text(SUBSCRIPTION_TAB)
    assert CATALOG_LOAD_ERR in sub
    assert "apiErrorMessage" in sub


def test_ac_neg_05_subscription_tab_does_not_trigger_generate():
    """AC-NEG-05: Subscription Upgrade/Current do not trigger generate."""
    sub = read_text(SUBSCRIPTION_TAB)
    assert "run_generation_pipeline" not in sub
    assert "/posts/generate" not in sub
    assert "postsApi.generate" not in sub


def test_ac_ed_05_target_posts_per_week_visible_disabled():
    """AC-ED-05 / Q-15: Target Posts Per Week visible but disabled; Auto-Publish stays distinct."""
    src = read_text(TOPICS_TSX)
    assert src, "Topics.tsx missing"
    assert TARGET_PPW in src
    idx = src.find(TARGET_PPW)
    window = src[idx : idx + 900]
    assert "disabled" in window
    assert "auto_publish" in src or "Auto-Publish" in src or "auto-publish" in src.lower()


def test_ac_neg_06_topics_ui_cannot_edit_posts_per_week():
    """AC-NEG-06: Topics Style control is disabled so the user cannot change frequency there."""
    src = read_text(TOPICS_TSX)
    idx = src.find(TARGET_PPW)
    window = src[idx : idx + 800] if idx >= 0 else src
    assert "disabled" in window


def test_ac_ed_09_generate_first_posts_removed_or_always_disabled():
    """AC-ED-09 / Q-11 A: Generate My First Posts removed or always disabled."""
    summary = read_text(SUMMARY_CARD)
    topics = read_text(TOPICS_TSX)
    blob = summary + "\n" + topics
    if COPY_GENERATE not in blob:
        return
    assert "disabled={!hasActiveTopic}" not in blob
    assert "disabled={ !hasActiveTopic }" not in blob
    assert "disabled" in blob


def test_ac_t8_catalog_plan_typescript_quota_keys():
    """C-BILLING-CATALOG §8: CatalogPlan includes daily_text/daily_image/weekly_image."""
    src = read_text(API_INDEX)
    assert src, "frontend/shared/api/index.ts missing"
    for key in QUOTA_KEYS:
        assert f"{key}:" in src or f"{key} :" in src
        assert f"{key}_posts" not in src
    assert "monthly_credits" in src


def test_ac_t8_04_admin_billing_may_send_quota_keys():
    """AC-T8-04: Admin Billing write body may include quota ints."""
    src = read_text(BILLING_TSX)
    if not src:
        src = glob_text(BILLING_TSX.parent if BILLING_TSX.parent.is_dir() else SHARED, "Billing.tsx")
    assert src, "Billing.tsx missing"
    for key in QUOTA_KEYS:
        assert key in src
