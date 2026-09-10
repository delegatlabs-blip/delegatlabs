"""TS-8 USER Overview removal + kept tenant credits. C-OVERVIEW-REMOVAL §1."""
from __future__ import annotations

from tests.ts8_helpers import route_table


def test_ac_uov_05_get_tenant_overview_is_gone(anon_client, api_app):
    """AC-UOV-05: GET /tenant/overview is not a success handler (404, not 2xx/410)."""
    routes = route_table(api_app)
    assert ("GET", "/tenant/overview") not in routes

    response = anon_client.get("/tenant/overview")
    assert response.status_code == 404
    assert response.status_code != 410


def test_ac_oos_07_get_tenant_credits_remains_registered(api_app):
    """AC-OOS-07: GET /tenant/credits stays; Q-10 deletes only overview."""
    assert ("GET", "/tenant/credits") in route_table(api_app)


def test_ac_nav_06_no_replacement_agent_list_api(api_app):
    """AC-NAV-06: no replacement agent-discovery GET for sidebar membership."""
    paths = {path for _method, path in route_table(api_app)}
    forbidden_substrings = (
        "/tenant/agents/subscribed",
        "/tenant/overview",
        "/tenant/agents/list",
        "/tenant/nav",
    )
    for fragment in forbidden_substrings:
        assert fragment not in paths


def test_c_overview_no_select_plan_or_purchase_routes(api_app):
    """C-BILLING-CATALOG §3.1: select_plan / purchase_pack / consume_for_action stay unmounted as paths.

    Debit is inside POST /posts/manual (not a dedicated /tenant/consume route).
    """
    joined = " ".join(f"{m} {p}" for m, p in route_table(api_app)).lower()
    for name in ("select_plan", "purchase_pack", "consume_for_action"):
        assert name not in joined
    for method in ("POST", "PATCH", "DELETE"):
        assert (method, "/tenant/catalog") not in route_table(api_app)
    paths = {path for _method, path in route_table(api_app)}
    assert "/tenant/consume" not in paths
    assert "/tenant/consume_for_action" not in paths
