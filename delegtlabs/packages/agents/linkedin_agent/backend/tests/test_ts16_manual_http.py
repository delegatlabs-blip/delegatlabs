"""TS-16 POST /posts/manual debit HTTP (Q-12, Q-19, Q-TS16-DEBIT-FAIL)."""
from __future__ import annotations

from fastapi import HTTPException

from tests.ts10_helpers import post_manual
from tests.ts8_helpers import TENANT_ID
from tests.ts16_helpers import (
    MANUAL_POST_COST,
    ROLE_DETAIL,
    TITLE_DESC_DETAIL,
    consume_called_with_manual,
    insufficient_credits_detail,
)
from tests.ts16_store import TENANT_B


def test_ac_hp_13_manual_debits_manual_post_50(
    ts16_manual_client, consume_spy, publish_spy, quota_store
):
    """AC-HP-13: owner POST /posts/manual calls consume_for_action(tenant, manual_post); 201."""
    response = post_manual(ts16_manual_client, title="Hello", description="World")
    assert response.status_code == 201
    consume_called_with_manual(consume_spy, TENANT_ID)
    assert publish_spy.await_count >= 1 or publish_spy.call_count >= 1
    args, kwargs = consume_spy.call_args
    blob = list(args) + list(kwargs.values())
    assert "text_post" not in blob
    assert "image_post" not in blob


def test_ac_hp_13_editor_may_debit(ts16_editor_client, consume_spy):
    """AC-HP-13: editor role still allowed on POST /posts/manual."""
    response = post_manual(ts16_editor_client, title="Hello", description="World")
    assert response.status_code == 201
    consume_called_with_manual(consume_spy)


def test_ac_hp_14_manual_ignores_subscription_quota(
    ts16_manual_client, consume_spy, quota_store
):
    """AC-HP-14 / Q-13: zero remaining slots still 201 + debit 50; usage not incremented."""
    from datetime import date

    quota_store.set_usage(TENANT_ID, "weekly_image", date(2026, 9, 7), used=1)
    before = dict(quota_store.usage)
    response = post_manual(ts16_manual_client, title="Hello", description="World")
    assert response.status_code == 201
    consume_called_with_manual(consume_spy)
    assert quota_store.usage == before


def test_ac_neg_03_insufficient_credits_402_no_publish(
    ts16_posts_app, consume_spy, publish_spy, quota_store
):
    """AC-NEG-03 / Q-TS16-DEBIT-FAIL peek: balance 0 and 49 → 402; no consume; no 201."""
    from tests.ts16_helpers import _client
    from tests.ts8_helpers import tenant_ctx

    for balance in (0, 49):
        consume_spy.reset_mock()
        publish_spy.reset_mock()
        quota_store.credits[TENANT_ID] = balance
        client = _client(
            ts16_posts_app,
            ctx=tenant_ctx(),
            consume_spy=consume_spy,
            publish_spy=publish_spy,
            store=quota_store,
        )
        try:
            response = post_manual(client, title="Hello", description="World")
        finally:
            client.close()
        assert response.status_code == 402
        detail = response.json().get("detail")
        assert isinstance(detail, str)
        expected = insufficient_credits_detail("manual_post", MANUAL_POST_COST, balance)
        assert expected in detail or (
            "manual_post" in detail and "50" in detail and str(balance) in detail
        )
        consume_spy.assert_not_called()
        publish_spy.assert_not_called()
        assert quota_store.credits[TENANT_ID] == balance


def test_ac_neg_04_viewer_cannot_debit(ts16_viewer_client, consume_spy, quota_store):
    """AC-NEG-04: viewer 403; credits unchanged."""
    before = quota_store.credits[TENANT_ID]
    response = post_manual(ts16_viewer_client, title="Hello", description="World")
    assert response.status_code == 403
    assert response.json().get("detail") == ROLE_DETAIL
    consume_spy.assert_not_called()
    assert quota_store.credits[TENANT_ID] == before


def test_ac_err_04_validation_400_does_not_debit(ts16_manual_client, consume_spy, quota_store):
    """AC-ERR-04: missing title/description still 400 and does not debit."""
    response = post_manual(ts16_manual_client, title="   ", description="   ")
    assert response.status_code == 400
    assert TITLE_DESC_DETAIL in str(response.json().get("detail"))
    consume_spy.assert_not_called()
    over = post_manual(ts16_manual_client, title="Hi", description="x" * 3000)
    assert over.status_code == 400
    consume_spy.assert_not_called()


def test_q_ts16_debit_fail_consume_after_successful_publish(ts16_posts_app, quota_store):
    """Q-TS16-DEBIT-FAIL A: debit only after LinkedIn publish succeeds."""
    from tests.ts16_helpers import OrderedSpies, _client
    from tests.ts8_helpers import tenant_ctx

    spies = OrderedSpies()
    quota_store.credits[TENANT_ID] = 100
    client = _client(
        ts16_posts_app,
        ctx=tenant_ctx(),
        consume_spy=spies.consume,
        publish_spy=spies.publish,
        store=quota_store,
    )
    try:
        response = post_manual(client, title="Hello", description="World")
        assert response.status_code == 201
        assert spies.order == ["publish", "consume"]
    finally:
        client.close()


def test_q_ts16_debit_fail_publish_error_does_not_debit(ts16_posts_app, quota_store):
    """Q-TS16-DEBIT-FAIL A: if publish fails, do not debit."""
    from tests.ts16_helpers import OrderedSpies, _client
    from tests.ts8_helpers import tenant_ctx

    spies = OrderedSpies()
    spies.publish_error = HTTPException(status_code=502, detail="linkedin failed")
    quota_store.credits[TENANT_ID] = 100
    client = _client(
        ts16_posts_app,
        ctx=tenant_ctx(),
        consume_spy=spies.consume,
        publish_spy=spies.publish,
        store=quota_store,
    )
    try:
        response = post_manual(client, title="Hello", description="World")
        assert response.status_code != 201
        assert "consume" not in spies.order
    finally:
        client.close()


def test_ac_tn_03_wallet_debit_is_per_tenant(
    ts16_manual_client, ts16_tenant_b_client, consume_spy, quota_store
):
    """AC-TN-03: tenant A consume uses A's tenant_id; B's wallet unchanged."""
    quota_store.credits[TENANT_ID] = 80
    quota_store.credits[TENANT_B] = 90
    response = post_manual(ts16_manual_client, title="Hello", description="World")
    assert response.status_code == 201
    consume_called_with_manual(consume_spy, TENANT_ID)
    args, kwargs = consume_spy.call_args
    blob = list(args) + list(kwargs.values())
    assert TENANT_B not in blob
    assert quota_store.credits[TENANT_B] == 90
