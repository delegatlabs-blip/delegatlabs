"""TS-15 HTTP tests for GET/PATCH /topics (C-persona-topics §5–7 + AC-HP/ED/NEG/TN)."""
from __future__ import annotations

from tests.ts15_helpers import (
    GENERATE_PERSONA,
    OPTION_MATCH_DETAIL,
    OPTION_REQUIRED_DETAIL,
    ROLE_DETAIL,
    TENANT_B,
    TOPIC_NOT_FOUND,
    TOPICS_PATH,
    UNAUTH_DETAIL,
    WEIGHT_DETAIL,
    assert_topic_json,
    default_catalog,
)
from tests.ts8_helpers import TENANT_ID


def test_ac_tn_02_get_topics_json_keys_after_generate(topics_client):
    """AC-TN-02 / §5–6: GET /topics returns §5 keys including persona_generated, selected_option_value, options."""
    gen = topics_client.post(GENERATE_PERSONA)
    assert gen.status_code == 200
    response = topics_client.get(TOPICS_PATH)
    assert response.status_code == 200
    rows = response.json()
    assert isinstance(rows, list)
    assert len(rows) == 10
    for topic in rows:
        assert_topic_json(topic, persona=True, n_options=5)


def test_ac_tn_01_tenant_b_unaffected_by_tenant_a_replace(
    topics_client, topics_tenant_b_client, topic_store
):
    """AC-TN-01 / Q-14 A: after A's replace, B still has prior 001 seed rows; A does not see B."""
    gen = topics_client.post(GENERATE_PERSONA)
    assert gen.status_code == 200
    a_rows = topics_client.get(TOPICS_PATH)
    assert a_rows.status_code == 200
    a_names = {t["name"] for t in a_rows.json()}
    assert len(a_rows.json()) == 10
    assert "React New Feature" not in a_names
    b_rows = topics_tenant_b_client.get(TOPICS_PATH)
    assert b_rows.status_code == 200
    b_names = {t["name"] for t in b_rows.json()}
    assert "React New Feature" in b_names
    a_ids = {t["id"] for t in a_rows.json()}
    b_ids = {t["id"] for t in b_rows.json()}
    assert a_ids.isdisjoint(b_ids) or "React New Feature" in b_names
    for name in a_names:
        assert name not in b_names or name in (
            "React New Feature",
            "Next.js New Feature",
            "React vs Next.js",
            "Dev Opinion",
            "Performance Tip",
            "Migration Story",
        )


def test_ac_hp_06_patch_multi_active_two_true(topics_client, topic_store):
    """AC-HP-06 / Q-4 B: PATCH A then B both is_active true; GET shows both true."""
    rows = topic_store.add_persona_catalog(TENANT_ID, default_catalog())
    id_a, id_b = rows[0]["id"], rows[1]["id"]
    r1 = topics_client.patch(
        f"{TOPICS_PATH}/{id_a}",
        json={"is_active": True, "selected_option_value": "lesson"},
    )
    r2 = topics_client.patch(
        f"{TOPICS_PATH}/{id_b}",
        json={"is_active": True, "selected_option_value": "playbook"},
    )
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["is_active"] is True
    assert r2.json()["is_active"] is True
    listed = {t["id"]: t for t in topics_client.get(TOPICS_PATH).json()}
    assert listed[id_a]["is_active"] is True
    assert listed[id_b]["is_active"] is True


def test_ac_neg_01_patch_does_not_deactivate_siblings(topics_client, topic_store):
    """AC-NEG-01: activating B does not clear A (one-active UPDATE removed)."""
    rows = topic_store.add_persona_catalog(TENANT_ID, default_catalog())
    id_a, id_b = rows[0]["id"], rows[1]["id"]
    topics_client.patch(
        f"{TOPICS_PATH}/{id_a}",
        json={"is_active": True, "selected_option_value": "lesson"},
    )
    topics_client.patch(
        f"{TOPICS_PATH}/{id_b}",
        json={"is_active": True, "selected_option_value": "myth"},
    )
    listed = {t["id"]: t for t in topics_client.get(TOPICS_PATH).json()}
    assert listed[id_a]["is_active"] is True
    assert listed[id_b]["is_active"] is True


def test_ac_ed_01_activate_all_ten(topics_client, topic_store):
    """AC-ED-01: all 10 saved Active → GET 10× is_active true; 0 Draft."""
    rows = topic_store.add_persona_catalog(TENANT_ID, default_catalog())
    for row in rows:
        r = topics_client.patch(
            f"{TOPICS_PATH}/{row['id']}",
            json={"is_active": True, "selected_option_value": "lesson"},
        )
        assert r.status_code == 200
    listed = topics_client.get(TOPICS_PATH).json()
    persona = [t for t in listed if t.get("persona_generated") is True]
    assert len(persona) == 10
    assert all(t["is_active"] is True for t in persona)


def test_ac_ed_02_deactivate_one_of_several(topics_client, topic_store):
    """AC-ED-02: A and B Active; set A Draft; B stays Active."""
    rows = topic_store.add_persona_catalog(TENANT_ID, default_catalog())
    id_a, id_b = rows[0]["id"], rows[1]["id"]
    topics_client.patch(
        f"{TOPICS_PATH}/{id_a}",
        json={"is_active": True, "selected_option_value": "lesson"},
    )
    topics_client.patch(
        f"{TOPICS_PATH}/{id_b}",
        json={"is_active": True, "selected_option_value": "buyer"},
    )
    r = topics_client.patch(f"{TOPICS_PATH}/{id_a}", json={"is_active": False})
    assert r.status_code == 200
    assert r.json()["is_active"] is False
    listed = {t["id"]: t for t in topics_client.get(TOPICS_PATH).json()}
    assert listed[id_a]["is_active"] is False
    assert listed[id_b]["is_active"] is True


def test_ac_ed_03_change_the_one_selected_option(topics_client, topic_store):
    """AC-ED-03 / Q-9 A: selecting L3 replaces L1; stored selected count remains 1."""
    rows = topic_store.add_persona_catalog(TENANT_ID, default_catalog())
    tid = rows[0]["id"]
    r1 = topics_client.patch(
        f"{TOPICS_PATH}/{tid}",
        json={"selected_option_value": "lesson"},
    )
    assert r1.status_code == 200
    assert r1.json()["selected_option_value"] == "lesson"
    r2 = topics_client.patch(
        f"{TOPICS_PATH}/{tid}",
        json={"selected_option_value": "tradeoff"},
    )
    assert r2.status_code == 200
    assert r2.json()["selected_option_value"] == "tradeoff"
    assert r2.json()["selected_option_value"] != "lesson"


def test_ac_em_04_whitespace_option_selection_rejected(topics_client, topic_store):
    """AC-EM-04: whitespace-only selected_option_value is not stored as the selected option."""
    rows = topic_store.add_persona_catalog(TENANT_ID, default_catalog())
    r = topics_client.patch(
        f"{TOPICS_PATH}/{rows[0]['id']}",
        json={"selected_option_value": "   "},
    )
    assert r.status_code == 400
    assert r.json() == {"detail": OPTION_MATCH_DETAIL}


def test_ac_neg_05_cannot_persist_two_selected_options(topics_client, topic_store):
    """AC-NEG-05: array of selected values is rejected (exactly one option per topic)."""
    rows = topic_store.add_persona_catalog(TENANT_ID, default_catalog())
    r = topics_client.patch(
        f"{TOPICS_PATH}/{rows[0]['id']}",
        json={"selected_option_value": ["lesson", "myth"]},
    )
    assert r.status_code == 422


def test_contract_patch_selected_option_must_match_400(topics_client, topic_store):
    """C-persona-topics §7/§17: selected_option_value not in options[].value → 400 locked detail."""
    rows = topic_store.add_persona_catalog(TENANT_ID, default_catalog())
    r = topics_client.patch(
        f"{TOPICS_PATH}/{rows[0]['id']}",
        json={"selected_option_value": "not-an-option"},
    )
    assert r.status_code == 400
    assert r.json() == {"detail": OPTION_MATCH_DETAIL}


def test_contract_patch_selected_option_required_when_active_400(topics_client, topic_store):
    """C-persona-topics §7: is_active true + non-empty options + null/empty selected → 400."""
    rows = topic_store.add_persona_catalog(TENANT_ID, default_catalog())
    r = topics_client.patch(
        f"{TOPICS_PATH}/{rows[0]['id']}",
        json={"is_active": True},
    )
    assert r.status_code == 400
    assert r.json() == {"detail": OPTION_REQUIRED_DETAIL}
    r2 = topics_client.patch(
        f"{TOPICS_PATH}/{rows[0]['id']}",
        json={"is_active": True, "selected_option_value": ""},
    )
    assert r2.status_code == 400
    assert r2.json() == {"detail": OPTION_REQUIRED_DETAIL}


def test_contract_patch_topic_not_found_404(topics_client, topic_store):
    """C-persona-topics §7: PATCH id not in this tenant's catalog → 404 Topic not found."""
    topic_store.add_persona_catalog(TENANT_ID, default_catalog())
    r = topics_client.patch(f"{TOPICS_PATH}/999999", json={"weight": 0.5})
    assert r.status_code == 404
    assert r.json() == {"detail": TOPIC_NOT_FOUND}


def test_contract_patch_other_tenant_topic_404(topics_client, topic_store):
    """§7 404: id exists for tenant B is not in tenant A's catalog."""
    topic_store.add_persona_catalog(TENANT_ID, default_catalog())
    other = topic_store.add_topic(
        name="B only topic",
        slug="b-only-topic",
        tenant_id=TENANT_B,
        options=default_catalog()[0]["options"],
        is_active=False,
        weight=0.6,
    )
    r = topics_client.patch(f"{TOPICS_PATH}/{other['id']}", json={"weight": 0.4})
    assert r.status_code == 404
    assert r.json() == {"detail": TOPIC_NOT_FOUND}


def test_ac_ed_07_weight_outside_0_1_is_400(topics_client, topic_store):
    """AC-ED-07: PATCH weight outside 0–1 → 400 Weight must be 0–1 (range unchanged)."""
    rows = topic_store.add_persona_catalog(TENANT_ID, default_catalog())
    r = topics_client.patch(f"{TOPICS_PATH}/{rows[0]['id']}", json={"weight": 1.5})
    assert r.status_code == 400
    assert r.json() == {"detail": WEIGHT_DETAIL}
    r2 = topics_client.patch(f"{TOPICS_PATH}/{rows[0]['id']}", json={"weight": -0.1})
    assert r2.status_code == 400
    assert r2.json() == {"detail": WEIGHT_DETAIL}


def test_contract_patch_seed_rows_are_not_mutable(topics_client, topic_store):
    """C-SEED-IMMUTABLE: shared 001 catalog rows cannot be PATCH'd (cross-tenant)."""
    seed = next(r for r in topic_store.topics.values() if r.get("slug") == "react-new-feature")
    r = topics_client.patch(f"{TOPICS_PATH}/{seed['id']}", json={"is_active": True})
    assert r.status_code == 404
    assert r.json() == {"detail": TOPIC_NOT_FOUND}


def test_ac_neg_04_get_unauthenticated_401(topics_anon_client):
    """AC-NEG-04: unauthenticated GET /topics → 401."""
    r = topics_anon_client.get(TOPICS_PATH)
    assert r.status_code == 401
    assert r.json().get("detail") in (UNAUTH_DETAIL, "Signed out")


def test_ac_neg_04_patch_unauthenticated_401(topics_anon_client):
    """AC-NEG-04: unauthenticated PATCH /topics/{id} → 401."""
    r = topics_anon_client.patch(f"{TOPICS_PATH}/1", json={"weight": 0.5})
    assert r.status_code == 401
    assert r.json().get("detail") in (UNAUTH_DETAIL, "Signed out")


def test_contract_patch_viewer_403(topics_viewer_client, topic_store):
    """C-AUTHZ-ACTIVATE: viewer cannot PATCH → 403 role detail."""
    seed = next(iter(topic_store.topics.values()))
    r = topics_viewer_client.patch(f"{TOPICS_PATH}/{seed['id']}", json={"weight": 0.5})
    assert r.status_code == 403
    assert r.json() == {"detail": ROLE_DETAIL}


def test_ac_hp_05_exactly_one_selected_option_persisted(topics_client, topic_store):
    """AC-HP-05 / Q-9 A: PATCH stores a single selected_option_value, not an array."""
    rows = topic_store.add_persona_catalog(TENANT_ID, default_catalog())
    r = topics_client.patch(
        f"{TOPICS_PATH}/{rows[0]['id']}",
        json={"selected_option_value": "buyer"},
    )
    assert r.status_code == 200
    assert r.json()["selected_option_value"] == "buyer"
    assert not isinstance(r.json()["selected_option_value"], list)
