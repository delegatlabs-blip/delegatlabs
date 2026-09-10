"""TS-11 HTTP tests for POST /posts/improve (C-posts-improve + AC-HP/EM/ED/NEG/ERR).

Gemini is AsyncMock — no live API. Auth override matches TS-10 posts_client.
"""
from __future__ import annotations

from tests.ts11_helpers import (
    EMPTY_BOTH_DETAIL,
    GEMINI_KEY_DETAIL,
    LINKEDIN_CHAR_LIMIT,
    POSTS_IMPROVE,
    ROLE_DETAIL,
    UNAUTH_DETAIL,
    compose_manual_body,
    improve_call_kwargs,
    over_limit_detail,
    post_improve,
)
from tests.ts8_helpers import route_table


def test_ac_neg_02_improve_is_post_posts_improve_not_generate(improve_app):
    """AC-NEG-02: Improve is POST /posts/improve, not POST /posts/generate."""
    table = route_table(improve_app)
    assert ("POST", POSTS_IMPROVE) in table or any(
        m == "POST" and p.endswith("/posts/improve") for m, p in table
    )
    # Generate remains a different route if still mounted on this router.
    improve_paths = {p for m, p in table if m == "POST" and p.endswith("/posts/improve")}
    generate_paths = {p for m, p in table if m == "POST" and p.endswith("/posts/generate")}
    assert improve_paths
    assert improve_paths.isdisjoint(generate_paths)


def test_ac_hp_03_request_sends_title_description_tags(improve_client, improve_mock):
    """AC-HP-03: JSON body includes title, description, tags (plain text, not HTML)."""
    response = post_improve(
        improve_client,
        title="Headline",
        description="Plain body text",
        tags="React, WebDev",
    )
    assert response.status_code == 200
    kwargs = improve_call_kwargs(improve_mock)
    assert kwargs.get("title") == "Headline"
    assert kwargs.get("description") == "Plain body text"
    tags = kwargs.get("tags")
    assert tags is not None
    joined = tags if isinstance(tags, str) else " ".join(tags)
    assert "React" in joined and "WebDev" in joined


def test_ac_hp_03_html_description_is_not_required_by_api(improve_client, improve_mock):
    """AC-HP-03 / U-TS11-5 C: API accepts plain description (client strips before send)."""
    response = post_improve(
        improve_client,
        title="Headline",
        description="No tags in this string",
        tags="AI",
    )
    assert response.status_code == 200
    kwargs = improve_call_kwargs(improve_mock)
    assert "<p>" not in kwargs.get("description", "")
    assert "<strong>" not in kwargs.get("description", "")


def test_ac_hp_04_success_200_html_and_plaintext(improve_client, improve_mock):
    """AC-HP-04: HTTP 200 JSON has ok, html (TipTap), plainText. Not 201."""
    improve_mock.return_value = {
        "html": "<p>Polished body</p>",
        "plainText": "Polished body",
    }
    response = post_improve(improve_client)
    assert response.status_code == 200
    assert response.status_code != 201
    body = response.json()
    assert body.get("ok") is True
    assert "html" in body
    assert "plainText" in body
    assert "<" in body["html"]
    assert body["html"]
    for forbidden in ("promptUsed", "text", "post", "description"):
        assert forbidden not in body


def test_ac_hp_06_calls_improve_post_text_not_generate_post(improve_client, improve_mock):
    """AC-HP-06: handler awaits improve_post_text; must not use topic generate_post."""
    response = post_improve(improve_client, title="Headline", description="Body")
    assert response.status_code == 200
    assert improve_mock.await_count >= 1 or improve_mock.call_count >= 1


def test_ac_hp_08_empty_description_with_title_is_not_400(improve_client, improve_mock):
    """AC-HP-08: title present, description empty → not 400 for empty description."""
    response = post_improve(
        improve_client, title="Headline", description="", tags="AI"
    )
    assert response.status_code != 400
    assert response.status_code == 200
    kwargs = improve_call_kwargs(improve_mock)
    assert kwargs.get("title") == "Headline"
    assert kwargs.get("description") == ""


def test_ac_hp_09_empty_title_with_description_is_not_400(improve_client, improve_mock):
    """AC-HP-09: description present, title empty → not 400 for empty title (unlike manual)."""
    response = post_improve(
        improve_client, title="", description="Polish this body", tags="AI"
    )
    assert response.status_code != 400
    assert response.status_code == 200
    kwargs = improve_call_kwargs(improve_mock)
    assert kwargs.get("title") == ""
    assert kwargs.get("description") == "Polish this body"


def test_ac_hp_10_improve_does_not_persist_via_manual_or_generate(
    improve_client, improve_mock
):
    """AC-HP-10: Improve is 200 preview only — not POST /posts/manual or /posts/generate."""
    response = post_improve(improve_client)
    assert response.status_code == 200
    body = response.json()
    assert body.get("ok") is True
    assert "id" not in body
    assert improve_mock.await_count >= 1 or improve_mock.call_count >= 1


def test_ac_em_03_both_empty_is_400_and_skips_gemini(improve_client, improve_mock):
    """AC-EM-03: both empty after trim → 400 locked detail; no Gemini call."""
    response = post_improve(improve_client, title="", description="")
    assert response.status_code == 400
    assert response.json() == {"detail": EMPTY_BOTH_DETAIL}
    assert improve_mock.await_count == 0
    assert improve_mock.call_count == 0


def test_ac_em_03_whitespace_both_empty_is_400(improve_client, improve_mock):
    """AC-EM-02/03 API: whitespace-only title+description trim to empty → 400, no Gemini."""
    response = post_improve(improve_client, title="   ", description=" \n ")
    assert response.status_code == 400
    assert response.json() == {"detail": EMPTY_BOTH_DETAIL}
    assert improve_mock.call_count == 0
    assert improve_mock.await_count == 0


def test_ac_ed_02_composed_out_over_3000_is_400(improve_client, improve_mock):
    """AC-ED-02: after polish, composed plain > 3000 → 400 same over-limit detail shape."""
    title = "Hi"
    description = "short"
    plain = "x" * 3000
    improve_mock.return_value = {"html": f"<p>{plain}</p>", "plainText": plain}
    composed = compose_manual_body(title, plain)
    assert len(composed) > LINKEDIN_CHAR_LIMIT
    response = post_improve(improve_client, title=title, description=description)
    assert response.status_code == 400
    assert response.json() == {"detail": over_limit_detail(len(composed))}


def test_ac_ed_02_composed_in_over_3000_skips_gemini(improve_client, improve_mock):
    """C-posts-improve §4: over-limit on input compose is 400 before improve_post_text."""
    title = "Hi"
    description = "x" * 3000
    composed = compose_manual_body(title, description)
    assert len(composed) > LINKEDIN_CHAR_LIMIT
    response = post_improve(improve_client, title=title, description=description)
    assert response.status_code == 400
    assert response.json() == {"detail": over_limit_detail(len(composed))}
    assert improve_mock.call_count == 0
    assert improve_mock.await_count == 0


def test_ac_ed_04_composed_exactly_3000_is_allowed(improve_client, improve_mock):
    """AC-ED-04: composed length === 3000 is not rejected (`>` only)."""
    title = "Hi"
    # compose = title + \\n\\n + plain → 2 + 2 + 2996 = 3000
    plain = "y" * 2996
    assert len(compose_manual_body(title, plain)) == LINKEDIN_CHAR_LIMIT
    improve_mock.return_value = {"html": f"<p>{plain}</p>", "plainText": plain}
    response = post_improve(improve_client, title=title, description="short")
    assert response.status_code == 200
    body = response.json()
    assert body.get("ok") is True
    assert body.get("plainText") == plain


def test_ac_ed_05_tags_sent_when_generating_from_title(improve_client, improve_mock):
    """AC-ED-05: empty description + title + tags still passes tags into the helper."""
    response = post_improve(
        improve_client, title="Headline", description="", tags="AI, React"
    )
    assert response.status_code == 200
    kwargs = improve_call_kwargs(improve_mock)
    tags = kwargs.get("tags")
    joined = tags if isinstance(tags, str) else " ".join(tags or [])
    assert "AI" in joined and "React" in joined


def test_ac_neg_01_unauthenticated_is_401(improve_anon_client, improve_mock):
    """AC-NEG-01: unauthenticated POST /posts/improve → 401 locked require_auth detail."""
    response = post_improve(improve_anon_client)
    assert response.status_code == 401
    detail = response.json().get("detail")
    assert detail in (UNAUTH_DETAIL, "Signed out")
    assert improve_mock.call_count == 0
    assert improve_mock.await_count == 0


def test_ac_neg_02_generate_post_request_shape_is_not_improve_body(improve_client):
    """AC-NEG-02: GeneratePostRequest {topicId, sourceUrl} is not a valid Improve body."""
    response = post_improve(
        improve_client,
        json_body={"topicId": 1, "sourceUrl": "https://example.com"},
    )
    # Missing title+description after defaults → 400 both-empty, or 422 if extra-forbidden.
    assert response.status_code in (400, 422)
    assert response.status_code != 200


def test_ac_err_02_value_error_is_500_gemini_key_detail(improve_client, improve_mock):
    """AC-ERR-02: ValueError from helper → 500 {"detail": GEMINI_API_KEY message}."""
    improve_mock.side_effect = ValueError(GEMINI_KEY_DETAIL)
    response = post_improve(improve_client)
    assert response.status_code == 500
    assert response.json() == {"detail": GEMINI_KEY_DETAIL}


def test_ac_err_02_runtime_error_is_500_all_models_detail(improve_client, improve_mock):
    """AC-ERR-02: RuntimeError from helper → 500 with that string as detail."""
    msg = "Gemini API post generation failed across all models. Error: empty improve output"
    improve_mock.side_effect = RuntimeError(msg)
    response = post_improve(improve_client)
    assert response.status_code == 500
    assert response.json() == {"detail": msg}


def test_ac_err_02_failure_is_not_200_and_has_no_html_accept_payload(
    improve_client, improve_mock
):
    """AC-ERR-02: non-success must not return the 200 html/plainText Accept payload."""
    improve_mock.side_effect = RuntimeError(
        "Gemini API post generation failed across all models. Error: boom"
    )
    response = post_improve(improve_client)
    assert response.status_code != 200
    body = response.json()
    assert body.get("ok") is not True
    assert "html" not in body or response.status_code >= 400


def test_ac_ed_07_one_helper_call_per_request(improve_client, improve_mock):
    """AC-ED-07: one Improve HTTP try per request — helper awaited once (no HTTP retry loop)."""
    response = post_improve(improve_client)
    assert response.status_code == 200
    assert improve_mock.await_count == 1 or improve_mock.call_count == 1


def test_contract_omitted_tags_still_200(improve_client, improve_mock):
    """C-posts-improve §2: tags may be omitted."""
    response = post_improve(
        improve_client, title="Headline", description="Body", omit_tags=True
    )
    assert response.status_code == 200
    kwargs = improve_call_kwargs(improve_mock)
    tags = kwargs.get("tags")
    assert tags in (None, [], "")


def test_contract_null_title_is_422(improve_client, improve_mock):
    """C-posts-improve §2: null title is Pydantic 422, not a silent coerce."""
    response = post_improve(
        improve_client,
        json_body={"title": None, "description": "Body"},
    )
    assert response.status_code == 422
    assert improve_mock.call_count == 0


def test_contract_viewer_is_403(improve_viewer_client, improve_mock):
    """C-posts-improve §1: viewer is not owner/admin/editor → 403 role detail."""
    response = post_improve(improve_viewer_client)
    assert response.status_code == 403
    assert response.json() == {"detail": ROLE_DETAIL}
    assert improve_mock.call_count == 0
    assert improve_mock.await_count == 0


def test_contract_content_type_json_not_multipart(improve_client):
    """C-posts-improve §1: application/json — form-urlencoded empty fields still 400 both-empty."""
    response = improve_client.post(POSTS_IMPROVE, data={"title": "", "description": ""})
    assert response.status_code in (400, 422)
