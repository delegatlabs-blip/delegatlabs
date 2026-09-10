"""TS-15 HTTP tests for POST /topics/generate-persona (C-persona-topics §1–4 + AC-HP/NEG/ERR).

Gemini is AsyncMock — no live API. Auth override matches TS-11.
"""
from __future__ import annotations

from tests.ts15_helpers import (
    FORBIDDEN_GENERATE_KEYS,
    GENERATE_PERSONA,
    ROLE_DETAIL,
    SESSION_NOT_COMPLETED,
    UNAUTH_DETAIL,
    assert_generate_success,
    assert_topic_json,
    default_catalog,
    set_session_status,
)
from tests.ts8_helpers import route_table


def test_ac_hp_01_post_topics_generate_persona_exists(topics_app):
    """AC-HP-01: POST /topics/generate-persona is registered (C-persona-topics §1)."""
    table = route_table(topics_app)
    assert ("POST", GENERATE_PERSONA) in table or any(
        m == "POST" and p.endswith("/topics/generate-persona") for m, p in table
    )


def test_ac_neg_04_generate_persona_unauthenticated_401(topics_anon_client, persona_mock):
    """AC-NEG-04: unauthenticated POST /topics/generate-persona → 401 locked detail."""
    response = topics_anon_client.post(GENERATE_PERSONA)
    assert response.status_code == 401
    assert response.json().get("detail") in (UNAUTH_DETAIL, "Signed out")
    assert persona_mock.await_count == 0
    assert persona_mock.call_count == 0


def test_contract_generate_persona_viewer_403(topics_viewer_client, persona_mock):
    """C-persona-topics §1: viewer cannot POST generate-persona → 403 role detail."""
    response = topics_viewer_client.post(GENERATE_PERSONA)
    assert response.status_code == 403
    assert response.json() == {"detail": ROLE_DETAIL}
    assert persona_mock.await_count == 0
    assert persona_mock.call_count == 0


def test_contract_generate_persona_session_not_completed_400(topics_client, persona_mock, topics_app):
    """C-persona-topics §4/§17: session.status != completed → 400 Adaptive session is not completed."""
    set_session_status(topics_app, "in_progress")
    response = topics_client.post(GENERATE_PERSONA)
    assert response.status_code == 400
    assert response.json() == {"detail": SESSION_NOT_COMPLETED}
    assert persona_mock.await_count == 0
    assert persona_mock.call_count == 0


def test_ac_hp_01_generate_persona_200_ok_ten_by_five(topics_client, persona_mock):
    """AC-HP-01 / Q-3 C / Q-8 C: HTTP 200 {ok:true, topics: 10 × 5 options} before adaptive complete."""
    response = topics_client.post(GENERATE_PERSONA)
    assert response.status_code == 200
    body = response.json()
    assert_generate_success(body)
    assert persona_mock.await_count >= 1 or persona_mock.call_count >= 1
    kwargs = {}
    if persona_mock.call_args:
        kwargs = persona_mock.call_args.kwargs or {}
    if kwargs:
        assert "profile" in kwargs


def test_ac_hp_04_generated_topics_are_draft(topics_client):
    """AC-HP-04 / Q-11 A: after 10×5 persist, all 10 are Draft (is_active false, selected_option_value null)."""
    response = topics_client.post(GENERATE_PERSONA)
    assert response.status_code == 200
    for topic in response.json()["topics"]:
        assert topic["is_active"] is False
        assert topic["selected_option_value"] is None
        assert_topic_json(topic, persona=True, n_options=5)


def test_ac_hp_09_success_catalog_is_exactly_ten(topics_client):
    """AC-HP-09: successful generate returns exactly those 10 — not 001 seed names mixed in."""
    response = topics_client.post(GENERATE_PERSONA)
    assert response.status_code == 200
    names = [t["name"] for t in response.json()["topics"]]
    assert len(names) == 10
    seed = {
        "React New Feature",
        "Next.js New Feature",
        "React vs Next.js",
        "Dev Opinion",
        "Performance Tip",
        "Migration Story",
    }
    assert seed.isdisjoint(set(names))


def test_contract_generate_persona_idempotent_skips_second_gemini(
    topics_client, persona_mock, topic_store
):
    """C-persona-topics §3: exactly 10 persona_generated rows → return them, no second Gemini."""
    rows = topic_store.add_persona_catalog(
        "11111111-1111-1111-1111-111111111111", default_catalog()
    )
    first = rows[0]
    topic_store.topics[first["id"]]["is_active"] = True
    topic_store.topics[first["id"]]["selected_option"] = "lesson"
    topic_store.topics[first["id"]]["weight"] = 0.8
    response = topics_client.post(GENERATE_PERSONA)
    assert response.status_code == 200
    assert persona_mock.await_count == 0
    assert persona_mock.call_count == 0
    body = response.json()
    assert_generate_success(body)
    matched = next(t for t in body["topics"] if t["id"] == first["id"])
    assert matched["is_active"] is True
    assert matched["selected_option_value"] == "lesson"
    assert float(matched["weight"]) == 0.8


def test_ac_hp_10_one_helper_call_per_user_triggered_generation(topics_client, persona_mock):
    """AC-HP-10: one HTTP try per user-triggered generation (no extra HTTP retry wrapper)."""
    response = topics_client.post(GENERATE_PERSONA)
    assert response.status_code == 200
    assert persona_mock.await_count == 1 or persona_mock.call_count == 1


def test_contract_generate_persona_ignores_body(topics_client, persona_mock):
    """C-persona-topics §2: no JSON body required; extra body (force) is ignored, still 200."""
    response = topics_client.post(GENERATE_PERSONA, json={"force": True, "topicId": 1})
    assert response.status_code == 200
    assert response.json().get("ok") is True
    assert len(response.json()["topics"]) == 10


def test_ac_neg_06_not_ten_by_five_is_not_success(topics_client, persona_mock, topic_store):
    """AC-NEG-06: helper result not 10×5 → not 2xx replaced catalog with some other count."""
    persona_mock.return_value = default_catalog()[:7]
    response = topics_client.post(GENERATE_PERSONA)
    body = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
    topics = body.get("topics") if isinstance(body, dict) else None
    assert not (response.status_code == 200 and isinstance(topics, list) and len(topics) != 10)
    assert response.status_code != 200
    listed = topics_client.get("/topics")
    if listed.status_code == 200 and isinstance(listed.json(), list):
        persona = [t for t in listed.json() if t.get("persona_generated") is True]
        assert len(persona) != 7


def test_ac_err_02_gemini_runtime_error_does_not_replace_catalog(
    topics_client, persona_mock
):
    """AC-ERR-02: RuntimeError from helper → 500; tenant still has pre-call seed list."""
    msg = "Gemini API post generation failed across all models. Error: expected 10 topics with 5 options each"
    persona_mock.side_effect = RuntimeError(msg)
    response = topics_client.post(GENERATE_PERSONA)
    assert response.status_code == 500
    assert response.json() == {"detail": msg}
    listed = topics_client.get("/topics")
    assert listed.status_code == 200
    rows = listed.json()
    assert isinstance(rows, list)
    assert rows, "failure must not wipe the tenant catalog to 0 rows"
    names = [t.get("name") for t in rows]
    assert "React New Feature" in names


def test_ac_err_02_value_error_gemini_key_is_500(topics_client, persona_mock):
    """AC-ERR-02 / §17: ValueError GEMINI_API_KEY → 500 locked detail."""
    from tests.ts15_helpers import GEMINI_KEY_DETAIL

    persona_mock.side_effect = ValueError(GEMINI_KEY_DETAIL)
    response = topics_client.post(GENERATE_PERSONA)
    assert response.status_code == 500
    assert response.json() == {"detail": GEMINI_KEY_DETAIL}


def test_contract_generate_success_omits_post_keys(topics_client):
    """C-persona-topics §3: success JSON must not add post / postError / promptUsed / text."""
    response = topics_client.post(GENERATE_PERSONA)
    assert response.status_code == 200
    body = response.json()
    for key in FORBIDDEN_GENERATE_KEYS:
        assert key not in body
