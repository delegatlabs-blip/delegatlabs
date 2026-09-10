"""TS-8 ADMIN catalog HTTP. C-BILLING-CATALOG §4 + requirements F/G."""
from __future__ import annotations

from uuid import uuid4

from tests.ts8_helpers import (
    ADMIN_CATALOG,
    ADMIN_COSTS,
    ADMIN_PACKS,
    ADMIN_PLANS,
    USER_CATALOG,
    assert_cost_shape,
    assert_envelope,
    assert_pack_shape,
    assert_plan_shape,
    route_table,
    seed_mixed_catalog,
)

PLAN_CREATE = {
    "code": "qa_created_plan",
    "name": "Created Plan",
    "price_inr_minor": 10000,
    "price_usd_minor": 100,
}
PACK_CREATE = {
    "code": "qa_created_pack",
    "name": "Created Pack",
    "credits": 200,
    "price_inr_minor": 10000,
    "price_usd_minor": 100,
}
COST_CREATE = {
    "action_key": "qa_created_cost",
    "label": "Created cost",
    "credits": 7,
}


def test_ac_auth_02_unauthenticated_admin_catalog_read_401(anon_client):
    """AC-AUTH-02: ADMIN catalog GET with no session → 401."""
    assert anon_client.get(ADMIN_CATALOG).status_code == 401


def test_ac_auth_01_unauthenticated_admin_writes_401(anon_client):
    """AC-AUTH-01: ADMIN catalog POST/PATCH with no session → 401."""
    unknown = str(uuid4())
    assert anon_client.post(ADMIN_PLANS, json=PLAN_CREATE).status_code == 401
    assert anon_client.patch(f"{ADMIN_PLANS}/{unknown}", json={"name": "x"}).status_code == 401
    assert anon_client.post(ADMIN_PACKS, json=PACK_CREATE).status_code == 401
    assert anon_client.patch(f"{ADMIN_PACKS}/{unknown}", json={"name": "x"}).status_code == 401
    assert anon_client.post(ADMIN_COSTS, json=COST_CREATE).status_code == 401
    assert anon_client.patch(f"{ADMIN_COSTS}/{unknown}", json={"label": "x"}).status_code == 401


def test_ac_auth_05_08_tenant_user_cannot_write_or_read_admin_catalog(tenant_client):
    """AC-AUTH-05 / AC-AUTH-08: non-staff tenant → 403 on ADMIN read and write; no insert."""
    read = tenant_client.get(ADMIN_CATALOG)
    assert read.status_code == 403
    created = tenant_client.post(ADMIN_PLANS, json=PLAN_CREATE)
    assert created.status_code == 403


def test_ac_auth_03_support_cannot_write(support_client):
    """AC-AUTH-03: staff support on catalog write → 403 (finance, tech)."""
    response = support_client.post(ADMIN_PLANS, json=PLAN_CREATE)
    assert response.status_code == 403
    detail = str(response.json().get("detail", response.text))
    assert "finance" in detail and "tech" in detail


def test_ac_auth_04_support_can_read(support_client, catalog_store):
    """AC-AUTH-04: staff support on catalog read → 2xx, including inactive."""
    seed_mixed_catalog(catalog_store)
    response = support_client.get(ADMIN_CATALOG)
    assert response.status_code == 200
    body = response.json()
    assert_envelope(body)
    codes = {p["code"] for p in body["plans"]}
    assert "inactive_plan" in codes
    assert "lead_plan" in codes


def test_ac_adm_04_06_tech_creates_and_updates_plan_pack_and_cost(tech_client, tenant_client):
    """AC-ADM-04/05/06 / AC-AUTH-06: tech create+update dual prices; USER sees active values."""
    plan = tech_client.post(ADMIN_PLANS, json=PLAN_CREATE)
    assert plan.status_code == 200
    plan_body = plan.json()
    assert_plan_shape(plan_body)
    assert plan_body["price_inr_minor"] == 10000
    assert plan_body["price_usd_minor"] == 100

    patched = tech_client.patch(
        f"{ADMIN_PLANS}/{plan_body['id']}",
        json={"price_inr_minor": 20000, "price_usd_minor": 200, "name": "Updated Plan"},
    )
    assert patched.status_code == 200
    assert patched.json()["price_inr_minor"] == 20000
    assert patched.json()["price_usd_minor"] == 200

    pack = tech_client.post(ADMIN_PACKS, json=PACK_CREATE)
    assert pack.status_code == 200
    pack_body = pack.json()
    assert_pack_shape(pack_body)
    assert pack_body["credits"] == 200
    pack_patch = tech_client.patch(
        f"{ADMIN_PACKS}/{pack_body['id']}",
        json={"credits": 250, "price_inr_minor": 15000, "price_usd_minor": 150},
    )
    assert pack_patch.status_code == 200
    assert pack_patch.json()["credits"] == 250

    cost = tech_client.post(ADMIN_COSTS, json=COST_CREATE)
    assert cost.status_code == 200
    cost_body = cost.json()
    assert_cost_shape(cost_body)
    cost_patch = tech_client.patch(
        f"{ADMIN_COSTS}/{cost_body['id']}",
        json={"credits": 9, "label": "Updated cost"},
    )
    assert cost_patch.status_code == 200
    assert cost_patch.json()["credits"] == 9

    user = tenant_client.get(USER_CATALOG)
    assert user.status_code == 200
    names = {p["name"] for p in user.json()["plans"]}
    assert "Updated Plan" in names


def test_ac_auth_06_finance_can_create_and_update(finance_client):
    """AC-AUTH-06 / AC-ADM-04: finance write allowed (2xx, row changed)."""
    plan = finance_client.post(
        ADMIN_PLANS,
        json={
            "code": "finance_plan",
            "name": "Finance Plan",
            "price_inr_minor": 500,
            "price_usd_minor": 5,
        },
    )
    assert plan.status_code == 200
    patched = finance_client.patch(
        f"{ADMIN_PLANS}/{plan.json()['id']}",
        json={"name": "Finance Plan 2"},
    )
    assert patched.status_code == 200
    assert patched.json()["name"] == "Finance Plan 2"


def test_ac_ina_01_is_active_writable_false(tech_client, tenant_client, support_client):
    """AC-INA-01 / AC-INA-03: staff can persist is_active=false; USER omits; ADMIN read includes."""
    created = tech_client.post(
        ADMIN_PLANS,
        json={**PLAN_CREATE, "code": "inactive_write", "is_active": False},
    )
    assert created.status_code == 200
    assert created.json()["is_active"] is False

    user_codes = {p["code"] for p in tenant_client.get(USER_CATALOG).json()["plans"]}
    admin_codes = {p["code"] for p in support_client.get(ADMIN_CATALOG).json()["plans"]}
    assert "inactive_write" not in user_codes
    assert "inactive_write" in admin_codes


def test_ac_zero_01_dual_price_zero_persistable(tech_client):
    """AC-ZERO-01: plan and pack with price_inr_minor=0 and price_usd_minor=0 → 2xx."""
    plan = tech_client.post(
        ADMIN_PLANS,
        json={"code": "zero_plan", "name": "Zero", "price_inr_minor": 0, "price_usd_minor": 0},
    )
    assert plan.status_code == 200
    assert plan.json()["price_inr_minor"] == 0
    assert plan.json()["price_usd_minor"] == 0

    pack = tech_client.post(
        ADMIN_PACKS,
        json={
            "code": "zero_pack",
            "name": "Zero pack",
            "credits": 1,
            "price_inr_minor": 0,
            "price_usd_minor": 0,
        },
    )
    assert pack.status_code == 200
    assert pack.json()["price_inr_minor"] == 0
    assert pack.json()["price_usd_minor"] == 0


def test_negative_prices_are_400(tech_client):
    """C-BILLING-CATALOG §4.3: price_* >= 0 CHECK failures → 400."""
    plan = tech_client.post(
        ADMIN_PLANS,
        json={"code": "neg_plan", "name": "Neg", "price_inr_minor": -1, "price_usd_minor": 0},
    )
    assert plan.status_code == 400
    pack = tech_client.post(
        ADMIN_PACKS,
        json={
            "code": "neg_pack",
            "name": "Neg",
            "credits": 1,
            "price_inr_minor": 0,
            "price_usd_minor": -1,
        },
    )
    assert pack.status_code == 400


def test_unknown_ids_404_with_contract_details(tech_client):
    """C-BILLING-CATALOG §4.2: unknown UUID → 404 with locked detail strings."""
    missing = str(uuid4())
    plan = tech_client.patch(f"{ADMIN_PLANS}/{missing}", json={"name": "x"})
    assert plan.status_code == 404
    assert plan.json()["detail"] == "Plan not found"

    pack = tech_client.patch(f"{ADMIN_PACKS}/{missing}", json={"name": "x"})
    assert pack.status_code == 404
    assert pack.json()["detail"] == "Credit pack not found"

    cost = tech_client.patch(f"{ADMIN_COSTS}/{missing}", json={"label": "x"})
    assert cost.status_code == 404
    assert cost.json()["detail"] == "Action cost not found"


def test_ac_adm_08_no_delete_catalog_routes(api_app, tech_client):
    """AC-ADM-08 / Q-BA-11: no DELETE catalog routes."""
    table = route_table(api_app)
    delete_catalog = [item for item in table if item[0] == "DELETE" and "/catalog" in item[1]]
    assert delete_catalog == []

    plan = tech_client.post(ADMIN_PLANS, json={**PLAN_CREATE, "code": "no_delete"})
    assert plan.status_code == 200
    deleted = tech_client.delete(f"{ADMIN_PLANS}/{plan.json()['id']}")
    assert deleted.status_code in {404, 405}


def test_duplicate_code_is_400(tech_client):
    """C-BILLING-CATALOG §4.3: unique code conflict → 400."""
    first = tech_client.post(ADMIN_PLANS, json=PLAN_CREATE)
    assert first.status_code == 200
    second = tech_client.post(ADMIN_PLANS, json=PLAN_CREATE)
    assert second.status_code == 400


def test_second_default_plan_is_400(tech_client):
    """C-BILLING-CATALOG §4.3: is_default true violating uq_sub_plans_default → 400."""
    first = tech_client.post(
        ADMIN_PLANS,
        json={**PLAN_CREATE, "code": "def_a", "is_default": True},
    )
    assert first.status_code == 200
    second = tech_client.post(
        ADMIN_PLANS,
        json={**PLAN_CREATE, "code": "def_b", "is_default": True},
    )
    assert second.status_code == 400


def test_ac_t8_04_admin_can_write_quota_ints(tech_client):
    """AC-T8-04 / C-BILLING-CATALOG §4.1: Admin PATCH/POST may include quota keys."""
    created = tech_client.post(
        ADMIN_PLANS,
        json={**PLAN_CREATE, "code": "quota_write", "daily_text": 2, "daily_image": 1, "weekly_image": 4},
    )
    assert created.status_code == 200
    body = created.json()
    assert_plan_shape(body)
    assert body["daily_text"] == 2
    assert body["daily_image"] == 1
    assert body["weekly_image"] == 4
    patched = tech_client.patch(
        f"{ADMIN_PLANS}/{body['id']}",
        json={"daily_text": 5, "daily_image": 3, "weekly_image": 1},
    )
    assert patched.status_code == 200
    assert patched.json()["daily_text"] == 5
    assert patched.json()["daily_image"] == 3
    assert patched.json()["weekly_image"] == 1


def test_negative_quota_ints_are_400(tech_client):
    """C-BILLING-CATALOG §4.1: quota keys use _require_nonneg_int when present."""
    plan = tech_client.post(
        ADMIN_PLANS,
        json={**PLAN_CREATE, "code": "neg_quota", "daily_text": -1},
    )
    assert plan.status_code == 400


def test_forbidden_write_keys_do_not_persist(tech_client):
    """C-BILLING-CATALOG §4.3: currency/price_minor/total_credits/gateway keys must not persist."""
    response = tech_client.post(
        ADMIN_PACKS,
        json={
            **PACK_CREATE,
            "code": "no_gateway",
            "total_credits": 9999,
            "currency": "USD",
            "price_minor": 1,
            "payment_intent": "pi_fake",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert "currency" not in body
    assert "price_minor" not in body
    assert "payment_intent" not in body
    assert body["total_credits"] == body["credits"] + body["bonus_credits"]
    assert body["total_credits"] != 9999
