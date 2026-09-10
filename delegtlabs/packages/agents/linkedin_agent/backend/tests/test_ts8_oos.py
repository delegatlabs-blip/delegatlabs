"""TS-8 out-of-scope non-changes. AC-OOS-* + AC-NOP persist surfaces.

C-BILLING-CATALOG §3.2 / TS-22: consume_for_action is allowed inside
posts.py manual_post_endpoint (manual_post) and generate_post_endpoint
(text_post / image_post). It stays unmounted as its own HTTP path.
Improve and cron/jobs still must not debit.
"""
from __future__ import annotations

from pathlib import Path

from tests.ts8_helpers import BACKEND_ROOT, py_function_source, route_table

_ENDPOINT_DIR = BACKEND_ROOT / "app" / "api" / "endpoints"
_JOBS_DIR = BACKEND_ROOT / "app" / "jobs"
_CONFIG = BACKEND_ROOT / "app" / "core" / "config.py"
_ENV_EXAMPLE = BACKEND_ROOT / ".env.example"
_POSTS = _ENDPOINT_DIR / "posts.py"


def _read(path: Path) -> str:
    return path.read_text() if path.is_file() else ""


def test_ac_oos_02_stripe_stays_out_razorpay_billing_is_mounted(api_app):
    """Payments: Razorpay billing routes are mounted; Stripe stays out."""
    table = route_table(api_app)
    joined = " ".join(f"{m} {p}" for m, p in table).lower()
    paths = {p for _m, p in table}
    assert "stripe" not in joined
    assert "/tenant/billing/orders" in paths
    assert "/tenant/billing/verify" in paths
    assert "/tenant/billing/quota" in paths
    assert "/webhooks/razorpay" in paths

    router_src = _read(BACKEND_ROOT / "app" / "api" / "router.py").lower()
    assert "stripe" not in router_src
    assert "billing" in router_src

    settings_src = _read(_CONFIG)
    env_src = _read(_ENV_EXAMPLE)
    assert "RAZORPAY_KEY_ID" in settings_src
    assert "RAZORPAY_KEY_ID" in env_src
    for name in ("STRIPE", "STRIPE_SECRET"):
        assert name not in settings_src
        assert name not in env_src


def test_ac_oos_03_consume_only_in_manual_post_endpoint(api_app):
    """AC-OOS-03 / TS-22: debit allowed in manual_post_endpoint and generate_post_endpoint.

    generate MAY consume text_post/image_post. improve must not. Jobs must not.
    """
    posts_src = _read(_POSTS)
    assert posts_src, "posts.py missing"
    manual = py_function_source(posts_src, "manual_post_endpoint")
    generate = py_function_source(posts_src, "generate_post_endpoint")
    improve = py_function_source(posts_src, "improve_post_endpoint")
    assert manual, "manual_post_endpoint missing"
    assert "consume_for_action" in manual
    assert "manual_post" in manual
    if "consume_for_action" in generate:
        assert "text_post" in generate
        assert "image_post" in generate
        assert "manual_post" not in generate
    assert "consume_for_action" not in improve
    assert "purchase_pack" not in posts_src
    assert "select_plan" not in posts_src
    assert "_consume_credit" not in posts_src

    if _ENDPOINT_DIR.is_dir():
        for path in sorted(_ENDPOINT_DIR.glob("*.py")):
            if path.name == "posts.py":
                continue
            text = path.read_text()
            for name in ("consume_for_action", "purchase_pack", "select_plan"):
                assert name not in text, f"{path.name} must not contain {name}"

    if _JOBS_DIR.is_dir():
        for path in sorted(_JOBS_DIR.glob("*.py")):
            text = path.read_text()
            assert "consume_for_action" not in text, f"{path.name} cron/job must not debit"
            assert "_consume_credit" not in text

    joined = " ".join(f"{m} {p}" for m, p in route_table(api_app)).lower()
    assert "consume_for_action" not in joined
    assert "select_plan" not in joined
    assert "purchase_pack" not in joined


def test_ac_oos_01_admin_overview_client_apis_still_routed(api_app):
    """AC-OOS-01: ADMIN Overview must not depend on GET /tenant/overview (already unrouted)."""
    table = route_table(api_app)
    assert ("GET", "/tenant/overview") not in table
    paths = {path for _method, path in table if path.startswith("/admin")}
    assert paths, "admin router must remain mounted"


def test_ac_nop_01_02_no_tenant_persist_helpers_on_shared_client():
    """AC-NOP-01/02: shared tenantApi must not grow select/purchase/consume helpers."""
    shared = BACKEND_ROOT.parent / "frontend" / "shared" / "api"
    text = ""
    if shared.is_dir():
        text = "\n".join(p.read_text() for p in shared.rglob("*.ts"))
    assert "selectPlan" not in text
    assert "purchasePack" not in text
    assert "select_plan" not in text
    assert "purchase_pack" not in text
    assert "consumeForAction" not in text
    assert "consume_for_action" not in text
