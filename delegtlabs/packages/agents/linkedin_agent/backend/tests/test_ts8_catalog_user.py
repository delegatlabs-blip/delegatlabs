"""TS-8 USER catalog GET. Paths and shapes from C-BILLING-CATALOG §2–3."""
from __future__ import annotations

from tests.ts8_helpers import (
    USER_CATALOG,
    assert_cost_shape,
    assert_envelope,
    assert_pack_shape,
    assert_plan_shape,
    plan_row,
    seed_mixed_catalog,
)


def test_ac_err_01_unauthenticated_catalog_get_is_401(anon_client):
    """AC-ERR-01 / AC-AUTH-07 sibling: USER catalog GET with no session → 401."""
    response = anon_client.get(USER_CATALOG)
    assert response.status_code == 401


def test_ac_cat_07_tenant_user_catalog_get_is_2xx(tenant_client, catalog_store):
    """AC-CAT-07 / AC-AUTH-07: tenant session, no staff role, returns 2xx envelope."""
    seed_mixed_catalog(catalog_store)
    response = tenant_client.get(USER_CATALOG)
    assert response.status_code == 200
    body = response.json()
    assert_envelope(body)
    for plan in body["plans"]:
        assert_plan_shape(plan)
    for pack in body["packs"]:
        assert_pack_shape(pack)
    for cost in body["action_costs"]:
        assert_cost_shape(cost)


def test_ac_emp_03_empty_tables_return_2xx_empty_collections(tenant_client):
    """AC-EMP-03: zero catalog rows → 2xx with empty lists, not 5xx."""
    response = tenant_client.get(USER_CATALOG)
    assert response.status_code == 200
    body = response.json()
    assert_envelope(body)
    assert body["plans"] == []
    assert body["packs"] == []
    assert body["action_costs"] == []


def test_ac_ina_02_03_user_omits_inactive_and_keeps_active(tenant_client, catalog_store):
    """AC-INA-02 / AC-INA-03 (Q-BA-06 = omit / active_only): USER lists drop is_active=false."""
    rows = seed_mixed_catalog(catalog_store)
    response = tenant_client.get(USER_CATALOG)
    assert response.status_code == 200
    body = response.json()
    plan_codes = {p["code"] for p in body["plans"]}
    pack_codes = {p["code"] for p in body["packs"]}
    cost_keys = {c["action_key"] for c in body["action_costs"]}

    assert rows["active"]["code"] in plan_codes
    assert rows["inactive"]["code"] not in plan_codes
    assert rows["lead"]["code"] not in plan_codes
    assert rows["pack_on"]["code"] in pack_codes
    assert rows["pack_off"]["code"] not in pack_codes
    assert rows["cost_on"]["action_key"] in cost_keys
    assert rows["cost_off"]["action_key"] not in cost_keys


def test_user_catalog_ignores_active_only_query_param(tenant_client, catalog_store):
    """C-BILLING-CATALOG §3: no active_only query; USER cannot request inactive."""
    seed_mixed_catalog(catalog_store)
    response = tenant_client.get(USER_CATALOG, params={"active_only": "false"})
    assert response.status_code == 200
    codes = {p["code"] for p in response.json()["plans"]}
    assert "inactive_plan" not in codes


def test_ac_cat_user_envelope_forbids_subscription_balance_and_legacy_price(tenant_client, catalog_store):
    """C-BILLING-CATALOG §2.4: envelope is only plans/packs/action_costs."""
    catalog_store.add_plan({**plan_row(), "currency": "INR", "price_minor": 49900})
    response = tenant_client.get(USER_CATALOG)
    assert response.status_code == 200
    body = response.json()
    assert_envelope(body)
    if body["plans"]:
        assert "currency" not in body["plans"][0]
        assert "price_minor" not in body["plans"][0]


def test_ac_t8_02_user_plan_json_includes_quota_keys(tenant_client, catalog_store):
    """AC-T8-02: USER GET /tenant/catalog plan objects include daily_text/daily_image/weekly_image."""
    catalog_store.add_plan(
        plan_row(
            code="starter",
            name="Starter",
            monthly_credits=0,
            daily_text=1,
            daily_image=0,
            weekly_image=3,
        )
    )
    response = tenant_client.get(USER_CATALOG)
    assert response.status_code == 200
    body = response.json()
    assert_envelope(body)
    assert body["plans"]
    plan = next(p for p in body["plans"] if p["code"] == "starter")
    assert_plan_shape(plan)
    assert plan["daily_text"] == 1
    assert plan["daily_image"] == 0
    assert plan["weekly_image"] == 3
    assert plan["monthly_credits"] == 0
    assert "subscription" not in body
    assert "balance" not in body


def test_ac_nop_user_has_no_catalog_write_routes(tenant_client):
    """AC-NOP-01/02: USER catalog is GET-only; writes are not mounted on /tenant."""
    assert tenant_client.post(USER_CATALOG, json={}).status_code in {404, 405}
    assert tenant_client.patch(USER_CATALOG, json={}).status_code in {404, 405}
    assert tenant_client.delete(USER_CATALOG).status_code in {404, 405}
    assert tenant_client.post(f"{USER_CATALOG}/plans", json={"code": "x", "name": "x"}).status_code in {
        404,
        405,
    }
