"""TS-22 POST /posts/generate HTTP (peek 402, 201 consume, skipImage → skip_image).

Reuses ts16 QuotaStore + TestClient. No new HTTP client library.
"""
from __future__ import annotations

from fastapi import HTTPException

from tests.ts8_helpers import TENANT_ID, tenant_ctx
from tests.ts16_helpers import POSTS_GENERATE, ROLE_DETAIL, insufficient_credits_detail
from tests.ts22_helpers import (
    IMAGE_POST_COST,
    TEXT_POST_COST,
    GenerateOrderedSpies,
    consume_called_with,
    pipeline_kwarg,
    post_generate,
    seed_ts22_costs,
    ts22_client,
)


def test_ac_hp_05_06_text_201_consumes_text_post(
    ts22_generate_client, consume_spy, ts22_pipeline_spy
):
    """AC-HP-05/06: skipImage true → 201; skip_image True; consume text_post after pipeline."""
    response = post_generate(ts22_generate_client, {"skipImage": True})
    assert response.status_code == 201
    assert pipeline_kwarg(ts22_pipeline_spy, "skip_image") is True
    assert pipeline_kwarg(ts22_pipeline_spy, "quota_slot") is None
    consume_called_with(consume_spy, TENANT_ID, "text_post")
    blob = list(consume_spy.call_args.args) + list(consume_spy.call_args.kwargs.values())
    assert "image_post" not in blob
    assert "manual_post" not in blob
    body = response.json()
    assert body.get("id") is not None
    assert body.get("status") == "draft"


def test_ac_hp_07_image_201_consumes_image_post(
    ts22_generate_client, consume_spy, ts22_pipeline_spy
):
    """AC-HP-07: skipImage false → skip_image False; consume image_post."""
    response = post_generate(ts22_generate_client, {"skipImage": False})
    assert response.status_code == 201
    assert pipeline_kwarg(ts22_pipeline_spy, "skip_image") is False
    consume_called_with(consume_spy, TENANT_ID, "image_post")
    blob = list(consume_spy.call_args.args) + list(consume_spy.call_args.kwargs.values())
    assert "text_post" not in blob


def test_ac_hp_07_omitted_skip_image_defaults_false(
    ts22_generate_client, consume_spy, ts22_pipeline_spy
):
    """Contract §1: omitted skipImage defaults false (image path + image_post)."""
    response = post_generate(ts22_generate_client, {})
    assert response.status_code == 201
    assert pipeline_kwarg(ts22_pipeline_spy, "skip_image") is False
    consume_called_with(consume_spy, TENANT_ID, "image_post")


def test_ac_402_01_03_peek_text_no_pipeline_no_draft(
    ts16_posts_app, consume_spy, publish_spy, ts22_pipeline_spy, quota_store
):
    """AC-402-01/03 / Q-22-03 A: peek 402 before pipeline; no consume; no draft."""
    seed_ts22_costs(quota_store)
    for balance in (0, 9):
        consume_spy.reset_mock()
        ts22_pipeline_spy.reset_mock()
        quota_store.credits[TENANT_ID] = balance
        quota_store.posts = []
        client = ts22_client(
            ts16_posts_app,
            ctx=tenant_ctx(),
            consume_spy=consume_spy,
            publish_spy=publish_spy,
            pipeline_spy=ts22_pipeline_spy,
            store=quota_store,
        )
        try:
            response = post_generate(client, {"skipImage": True})
        finally:
            client.close()
        assert response.status_code == 402
        detail = response.json().get("detail")
        assert isinstance(detail, str)
        expected = insufficient_credits_detail("text_post", TEXT_POST_COST, balance)
        assert expected in detail or (
            "text_post" in detail
            and str(TEXT_POST_COST) in detail
            and str(balance) in detail
            and "Insufficient credits" in detail
        )
        consume_spy.assert_not_called()
        ts22_pipeline_spy.assert_not_called()
        assert quota_store.credits[TENANT_ID] == balance
        assert quota_store.posts == []


def test_ac_402_01_peek_image_402(
    ts16_posts_app, consume_spy, publish_spy, ts22_pipeline_spy, quota_store
):
    """AC-402-01: image_post peek 402 when balance cannot cover 30."""
    seed_ts22_costs(quota_store)
    quota_store.credits[TENANT_ID] = 29
    client = ts22_client(
        ts16_posts_app,
        ctx=tenant_ctx(),
        consume_spy=consume_spy,
        publish_spy=publish_spy,
        pipeline_spy=ts22_pipeline_spy,
        store=quota_store,
    )
    try:
        response = post_generate(client, {"skipImage": False})
    finally:
        client.close()
    assert response.status_code == 402
    detail = str(response.json().get("detail"))
    assert "Insufficient credits" in detail
    assert "image_post" in detail
    assert str(IMAGE_POST_COST) in detail
    consume_spy.assert_not_called()
    ts22_pipeline_spy.assert_not_called()


def test_q_22_03_consume_after_successful_pipeline(ts16_posts_app, publish_spy, quota_store):
    """Q-22-03 A: consume runs after successful pipeline INSERT, not before."""
    spies = GenerateOrderedSpies()
    seed_ts22_costs(quota_store)
    quota_store.credits[TENANT_ID] = 100
    client = ts22_client(
        ts16_posts_app,
        ctx=tenant_ctx(),
        consume_spy=spies.consume,
        publish_spy=publish_spy,
        pipeline_spy=spies.pipeline,
        store=quota_store,
    )
    try:
        response = post_generate(client, {"skipImage": True})
        assert response.status_code == 201
        assert spies.order == ["pipeline", "consume"]
    finally:
        client.close()


def test_q_22_03_failed_generate_does_not_consume(ts16_posts_app, publish_spy, quota_store):
    """Q-22-03 A: failed generate (no row) must not consume."""
    spies = GenerateOrderedSpies()
    spies.pipeline_error = HTTPException(status_code=404, detail="No active topics found")
    seed_ts22_costs(quota_store)
    quota_store.credits[TENANT_ID] = 100
    client = ts22_client(
        ts16_posts_app,
        ctx=tenant_ctx(),
        consume_spy=spies.consume,
        publish_spy=publish_spy,
        pipeline_spy=spies.pipeline,
        store=quota_store,
    )
    try:
        response = post_generate(client, {"skipImage": True})
        assert response.status_code != 201
        assert "consume" not in spies.order
    finally:
        client.close()


def test_q_s22_1_viewer_403_does_not_debit(
    ts22_viewer_client, consume_spy, ts22_pipeline_spy, quota_store
):
    """Q-S22-1 A: viewer 403; pipeline and consume do not run; credits unchanged."""
    before = quota_store.credits[TENANT_ID]
    response = post_generate(ts22_viewer_client, {"skipImage": True})
    assert response.status_code == 403
    assert response.json().get("detail") == ROLE_DETAIL
    consume_spy.assert_not_called()
    ts22_pipeline_spy.assert_not_called()
    assert quota_store.credits[TENANT_ID] == before


def test_q_s22_1_editor_may_generate(ts22_editor_client, consume_spy, ts22_pipeline_spy):
    """Q-S22-1 A: editor is allowed on POST /posts/generate."""
    response = post_generate(ts22_editor_client, {"skipImage": True})
    assert response.status_code == 201
    consume_called_with(consume_spy, TENANT_ID, "text_post")
    assert pipeline_kwarg(ts22_pipeline_spy, "skip_image") is True


def test_ac_oos_03_generate_path_unchanged(ts16_posts_app):
    """AC-OOS-03: posts router still mounts POST /posts/generate."""
    from tests.ts8_helpers import route_table

    table = route_table(ts16_posts_app)
    assert ("POST", POSTS_GENERATE) in table or any(
        m == "POST" and p.endswith("/posts/generate") for m, p in table
    )
