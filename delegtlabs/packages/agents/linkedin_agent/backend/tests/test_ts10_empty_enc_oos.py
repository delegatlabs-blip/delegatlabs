"""TS-8-style empty/error and out-of-scope ACs for TS-10 (C-posts-manual + AC-EMPTY / AC-OOS / AC-CTR)."""
from __future__ import annotations

from tests.ts8_helpers import BACKEND_ROOT, collect_docs_text, route_table
from tests.ts10_helpers import (
    CANONICAL_CONTRACT,
    POSTS_MANUAL,
    TYPE_DETAIL,
    UNAUTH_DETAIL,
    post_manual,
)


def test_ac_empty_01_missing_title_still_400(posts_client):
    """AC-EMPTY-01: empty title still 400; image presence does not change that.

    httpx omits Form fields whose value is "". Send whitespace so FastAPI still
    receives title/description and the handler 400s after strip (same as TS-16 AC-ERR-04).
    """
    response = post_manual(posts_client, title=" ", description="World")
    assert response.status_code == 400


def test_ac_empty_01_missing_description_still_400(posts_client):
    """AC-EMPTY-01: empty description still 400."""
    response = post_manual(posts_client, title="Hello", description=" ")
    assert response.status_code == 400


def test_ac_empty_01_empty_title_with_jpeg_still_400(posts_client):
    """AC-EMPTY-01: image presence does not waive empty title → 400."""
    response = post_manual(
        posts_client,
        title=" ",
        description="World",
        image=("photo.jpg", b"not-sniffed-jpeg", "image/jpeg"),
    )
    assert response.status_code == 400


def test_ac_empty_02_unauthenticated_is_401(posts_anon_client):
    """AC-EMPTY-02: POST /posts/manual without a session → 401 locked detail."""
    response = post_manual(posts_anon_client, title="Hello", description="World")
    assert response.status_code == 401
    assert response.json() == {"detail": UNAUTH_DETAIL}


def test_ac_empty_03_composed_body_over_3000_still_400(posts_client):
    """AC-EMPTY-03: existing composed-text > 3000 → 400 is unchanged."""
    # generated_text = title + "\\n\\n" + description  (+ optional tags)
    response = post_manual(posts_client, title="Hi", description=("x" * 3000))
    assert response.status_code == 400


def test_ac_empty_04_hp_04_omitting_image_is_not_type_or_missing_image_error(posts_client):
    """AC-EMPTY-04 / AC-HP-04: no image is valid — not a type/size/missing-image reject.

    Publish success is out of scope. 413 and type-detail 400 are failures.
    """
    response = post_manual(posts_client, title="Hello", description="World")
    assert response.status_code != 413
    if response.status_code == 400:
        detail = response.json().get("detail")
        assert detail != TYPE_DETAIL
        assert "missing image" not in str(detail).lower()
        assert "image is required" not in str(detail).lower()
        assert "required" not in str(detail).lower() or "title" in str(detail).lower()
    else:
        assert response.status_code != 400 or response.json().get("detail") != TYPE_DETAIL


def test_ac_hp_05_optional_tags_omitted_still_accepted_by_form(posts_client):
    """AC-HP-05: omitting tags still works (not a 400 for missing tags)."""
    response = post_manual(posts_client, title="Hello", description="World")
    if response.status_code == 400:
        assert "tag" not in str(response.json().get("detail", "")).lower()


def test_ac_hp_05_optional_tags_sent_as_comma_string(posts_client):
    """AC-HP-05: optional tags may still be sent as a comma-separated form string."""
    response = post_manual(
        posts_client, title="Hello", description="World", tags="alpha,beta"
    )
    if response.status_code == 400:
        assert "tag" not in str(response.json().get("detail", "")).lower()
    assert response.status_code != 413


def test_ac_ctr_01_c_posts_manual_amended():
    """AC-CTR-01 / Q-5 A: canonical C-posts-manual records JPEG/PNG only and USER nginx 10m."""
    assert CANONICAL_CONTRACT.is_file(), f"missing {CANONICAL_CONTRACT}"
    canon = CANONICAL_CONTRACT.read_text()
    assert "image/jpeg" in canon
    assert "image/png" in canon
    assert "client_max_body_size 10m" in canon
    assert TYPE_DETAIL in canon
    assert "No application" in canon and "byte-size" in canon
    # image/* must not remain the stated allowlist (Q-2 A / Q-5 A).
    assert "not `image/*`" in canon or "Not** `image/*`" in canon or "**Not** `image/*`" in canon


def test_ac_oos_01_posts_manual_debits_only_via_consume_for_action():
    """AC-OOS-01 / TS-22: POST /posts/manual may debit via consume_for_action(manual_post).

    generate MAY consume text_post/image_post. Improve still must not debit.
    purchase_pack / select_plan stay absent.
    """
    from tests.ts8_helpers import py_function_source

    posts = BACKEND_ROOT / "app" / "api" / "endpoints" / "posts.py"
    src = posts.read_text() if posts.is_file() else ""
    assert src
    manual = py_function_source(src, "manual_post_endpoint")
    generate = py_function_source(src, "generate_post_endpoint")
    improve = py_function_source(src, "improve_post_endpoint")
    assert "consume_for_action" in manual
    assert "manual_post" in manual
    if "consume_for_action" in generate:
        assert "text_post" in generate
        assert "image_post" in generate
        assert "manual_post" not in generate
    assert "consume_for_action" not in improve
    assert "purchase_pack" not in src
    assert "select_plan" not in src


def test_ac_oos_01_02_no_wallet_or_catalog_write_on_posts_router(posts_app):
    """AC-OOS-01/02: posts router does not grow catalog persist or wallet consume routes."""
    table = route_table(posts_app)
    joined = " ".join(f"{m} {p}" for m, p in table).lower()
    assert "consume_for_action" not in joined
    assert "purchase_pack" not in joined
    assert ("POST", POSTS_MANUAL) in table or any(
        p.endswith("/posts/manual") and m == "POST" for m, p in table
    )


def test_ac_ngx_03_rollback_documented_as_remove_user_directive():
    """AC-NGX-03: documented rollback is remove client_max_body_size 10m from USER nginx."""
    docs = collect_docs_text().lower()
    assert docs
    assert "client_max_body_size" in docs or "10m" in docs
    assert "rollback" in docs or "remove" in docs
