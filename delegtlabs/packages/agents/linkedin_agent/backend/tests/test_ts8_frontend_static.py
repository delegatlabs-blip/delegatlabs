"""TS-8 frontend ACs that are testable without a UI runner (source assertions).

user/admin package.json have no test/jest/vitest script (FACTS.md:577–579).
Interactive click/toast/empty-render ACs stay in known_gaps.
"""
from __future__ import annotations

import re
from pathlib import Path

from tests.ts8_helpers import (
    EMPTY_PACKS,
    EMPTY_PLANS,
    FRONTEND_ROOT,
    MOCK_CRED_BANNER,
    MOCK_SUB_BANNER,
    MOCK_USD_LABELS,
    NOOP_TOAST,
    collect_docs_text,
)

USER_SRC = FRONTEND_ROOT / "user" / "src"
ADMIN_SRC = FRONTEND_ROOT / "admin" / "src"
SHARED_API = FRONTEND_ROOT / "shared" / "api"


def _text(path: Path) -> str:
    return path.read_text() if path.is_file() else ""


def _first(name: str, root: Path) -> Path | None:
    hits = list(root.rglob(name))
    return hits[0] if hits else None


def _read_named(name: str, root: Path) -> str:
    path = _first(name, root)
    return _text(path) if path else ""


def _glob_text(root: Path, pattern: str) -> str:
    if not root.is_dir():
        return ""
    return "\n".join(p.read_text() for p in root.rglob(pattern) if p.is_file())


def test_ac_uov_01_sidebar_has_no_overview_item():
    """AC-UOV-01: UserSidebar has no Overview label and no /dashboard Overview landing."""
    sidebar = _read_named("UserSidebar.tsx", USER_SRC)
    assert sidebar, "UserSidebar.tsx missing"
    assert not re.search(r'label:\s*["\']Overview["\']', sidebar)
    assert not re.search(r'to:\s*["\']/dashboard["\']', sidebar)


def test_ac_uov_02_03_06_dashboard_redirects_to_post_gen():
    """AC-UOV-02/03/06: /dashboard Navigate → post-gen; chained landings go via /dashboard."""
    app = _read_named("App.tsx", USER_SRC)
    assert app, "user App.tsx missing"
    assert re.search(r'/dashboard["\'].*post-gen|post-gen["\'].*/dashboard', app) or (
        'to="/dashboard/agents/post-gen"' in app or "to={'/dashboard/agents/post-gen'}" in app
        or 'to="/dashboard/agents/post-gen"' in app
        or "Navigate to=\"/dashboard/agents/post-gen\"" in app
        or "to=\"/dashboard/agents/post-gen\"" in app
    )
    assert "Navigate to=\"/dashboard/agents/post-gen\"" in app or 'to="/dashboard/agents/post-gen"' in app


def test_ac_uov_04_tenant_overview_unrouted():
    """AC-UOV-04: no USER route element is TenantOverview / TenantOverviewPage."""
    app = _read_named("App.tsx", USER_SRC)
    assert "<TenantOverview" not in app
    assert "<TenantOverviewPage" not in app


def test_ac_nav_01_no_tenant_overview_fetch():
    """AC-NAV-01: UserSidebar does not call tenantApi.overview or query key tenant-overview."""
    sidebar = _read_named("UserSidebar.tsx", USER_SRC)
    assert "tenantApi.overview" not in sidebar
    assert "tenant-overview" not in sidebar


def test_ac_nav_02_post_gen_navigable():
    """AC-NAV-02: sidebar contains Post Gen path."""
    sidebar = _read_named("UserSidebar.tsx", USER_SRC)
    assert "/dashboard/agents/post-gen" in sidebar
    assert re.search(r"Post Gen", sidebar)


def test_ac_nav_03_04_lead_gen_and_analytics_soon():
    """AC-NAV-03/04 / AC-OOS-04: Lead Gen and Analytics stay disabled + Soon."""
    sidebar = _read_named("UserSidebar.tsx", USER_SRC)
    assert "Lead Gen" in sidebar
    assert "Analytics" in sidebar
    assert re.search(r"Soon", sidebar)
    assert "disabled: true" in sidebar or "disabled:true" in sidebar


def test_ac_nav_05_connections_navigable():
    """AC-NAV-05: Connections item to /dashboard/connections."""
    sidebar = _read_named("UserSidebar.tsx", USER_SRC)
    assert "/dashboard/connections" in sidebar
    app = _read_named("App.tsx", USER_SRC)
    assert "TenantConnectionsPage" in app or "connections" in app.lower()


def test_ac_nav_06_sidebar_not_agent_list_http():
    """AC-NAV-06: nav membership is static — no subscribedAgents HTTP derivation."""
    sidebar = _read_named("UserSidebar.tsx", USER_SRC)
    assert "tenantApi.overview" not in sidebar
    assert "subscribedAgents" not in sidebar or "fetch" not in sidebar.lower()


def test_ac_nav_07_topics_unchanged():
    """AC-NAV-07: Content → Topics nav still exists."""
    sidebar = _read_named("UserSidebar.tsx", USER_SRC)
    assert re.search(r"Topics", sidebar)


def test_ac_cat_01_02_03_tabs_do_not_import_mock_billing():
    """AC-CAT-01/02/03: Subscription/Credits tabs do not import mock-billing symbols."""
    sub = _read_named("SubscriptionTab.tsx", USER_SRC)
    cred = _read_named("CreditsTab.tsx", USER_SRC)
    assert sub and cred
    for src in (sub, cred):
        assert "mock-billing" not in src
        assert "MOCK_PLANS" not in src
        assert "MOCK_CREDIT_PACKS" not in src
        assert "DEFAULT_MOCK_PLAN_ID" not in src


def test_ac_cat_04_user_prices_are_inr_not_mock_usd():
    """AC-CAT-04: USER tabs do not show locked-out mock USD labels."""
    sub = _read_named("SubscriptionTab.tsx", USER_SRC)
    cred = _read_named("CreditsTab.tsx", USER_SRC)
    blob = sub + cred
    for label in MOCK_USD_LABELS:
        assert label not in blob
    assert "₹" in blob or "INR" in blob or "price_inr_minor" in blob


def test_ac_cat_08_mock_banners_gone_checkout_wired():
    """Mock banners absent; Upgrade/Purchase start Razorpay checkout."""
    sub = _read_named("SubscriptionTab.tsx", USER_SRC)
    cred = _read_named("CreditsTab.tsx", USER_SRC)
    blob = sub + cred
    assert MOCK_SUB_BANNER not in blob
    assert MOCK_CRED_BANNER not in blob
    assert NOOP_TOAST not in blob
    assert "useBillingCheckout" in blob
    assert "createOrder" in _glob_text(SHARED_API, "*.ts")


def test_ac_emp_01_02_empty_copy_locked():
    """AC-EMP-01/02: locked empty-state strings (Wave-3 answers)."""
    sub = _read_named("SubscriptionTab.tsx", USER_SRC)
    cred = _read_named("CreditsTab.tsx", USER_SRC)
    assert EMPTY_PLANS in sub
    assert EMPTY_PACKS in cred


def test_ac_hp_01_subscription_tab_is_quota_mix_not_credits_month():
    """AC-HP-01 / AC-T8-02: USER Subscription must not render N credits / month."""
    sub = _read_named("SubscriptionTab.tsx", USER_SRC)
    assert sub, "SubscriptionTab.tsx missing"
    assert "credits / month" not in sub
    assert "credits/month" not in sub
    assert "{plan.monthly_credits}" not in sub
    assert "daily_text" in sub
    assert "daily_image" in sub
    assert "weekly_image" in sub
    assert "daily_text_posts" not in sub
    assert "daily_image_posts" not in sub
    assert "weekly_image_posts" not in sub
    assert "Free trial" not in sub


def test_ac_cat_05_06_tabs_read_tenant_catalog():
    """AC-CAT-05/06 (source): tabs consume catalog GET, not MOCK_* collections."""
    sub = _read_named("SubscriptionTab.tsx", USER_SRC)
    cred = _read_named("CreditsTab.tsx", USER_SRC)
    shared = _glob_text(SHARED_API, "*.ts")
    assert "catalog" in (sub + cred).lower() or "tenantApi.catalog" in (sub + cred + shared)
    assert "/tenant/catalog" in shared


def test_ac_ba_05_no_session_current_highlight():
    """Wave-3: session Current highlight is NOT allowed (no DEFAULT_MOCK_PLAN_ID state)."""
    sub = _read_named("SubscriptionTab.tsx", USER_SRC)
    assert "DEFAULT_MOCK_PLAN_ID" not in sub
    assert "useState<string>(DEFAULT_MOCK_PLAN_ID)" not in sub


def test_ac_adm_01_billing_is_not_overview_redirect():
    """AC-ADM-01: ADMIN /billing is a real page, not Navigate to /overview."""
    app = _read_named("App.tsx", ADMIN_SRC)
    assert app
    assert not re.search(
        r'path=["\']/billing["\'][\s\S]{0,80}Navigate to=["\']/overview["\']',
        app,
    )


def test_ac_adm_02_admin_overview_home_stays():
    """AC-ADM-02: /overview still OverviewPage; / and * still go to /overview."""
    app = _read_named("App.tsx", ADMIN_SRC)
    login = _read_named("Login.tsx", ADMIN_SRC)
    assert "OverviewPage" in app
    assert re.search(r'path=["\']/["\'][\s\S]{0,80}/overview', app)
    assert "/overview" in login


def test_ac_adm_03_control_nav_billing_label():
    """AC-ADM-03 / Q-BA-10: Control nav item to /billing labeled Billing."""
    sidebar = _read_named("AdminSidebar.tsx", ADMIN_SRC)
    assert sidebar
    assert re.search(r'to:\s*["\']/billing["\']', sidebar)
    assert re.search(r'label:\s*["\']Billing["\']', sidebar)


def test_ac_adm_07_admin_ui_exposes_both_price_columns():
    """AC-ADM-07: ADMIN billing UI has price_inr_minor and price_usd_minor fields."""
    admin_pages = _glob_text(ADMIN_SRC, "*.tsx")
    assert "price_inr_minor" in admin_pages
    assert "price_usd_minor" in admin_pages


def test_ac_adm_08_admin_ui_has_no_delete_sku_control():
    """AC-ADM-08: no DELETE catalog client helper."""
    shared = _glob_text(SHARED_API, "*.ts")
    for name in ("deletePlan", "deletePack", "deleteActionCost", "deleteCatalog"):
        assert name not in shared


def test_ac_oos_06_user_billing_page_is_mounted():
    """USER Manage Subscription is a real page at /dashboard/billing; Team stays gone."""
    app = _read_named("App.tsx", USER_SRC)
    sidebar = _read_named("UserSidebar.tsx", USER_SRC)
    assert "ManageSubscription" in app
    assert "/dashboard/billing" in app
    assert "TenantTeam" not in app
    assert "BillingPage" not in app
    assert "Manage Subscription" in sidebar
    assert "/dashboard/billing" in sidebar


def test_ac_oos_07_shared_client_keeps_credits_drops_overview():
    """AC-OOS-07 + C-OVERVIEW-REMOVAL: tenantApi.credits stays; tenantApi.overview removed."""
    shared = _glob_text(SHARED_API, "*.ts")
    assert "/tenant/credits" in shared
    assert "overview: ()" not in shared
    assert "/tenant/overview" not in shared
    assert "/tenant/catalog" in shared
    assert "/admin/catalog" in shared


def test_ac_doc_01_changelog_records_overview_and_catalog():
    """AC-DOC-01: agent-package docs/changelog record overview removal and catalog-backed tabs."""
    docs = collect_docs_text().lower()
    assert docs, "no README/CHANGELOG/STRUCTURE under agent package"
    assert "overview" in docs
    assert "tenant/overview" in docs or "get /tenant/overview" in docs
    assert "catalog" in docs


def test_ac_oos_05_no_matchifyx_or_linkedin_contract_files_added_as_product():
    """AC-OOS-05: this task must not add Matchifyx product code under the agent frontend."""
    blob = _glob_text(USER_SRC, "*.tsx") + _glob_text(ADMIN_SRC, "*.tsx")
    assert "Matchifyx" not in blob
    assert "GraphRAG" not in blob
