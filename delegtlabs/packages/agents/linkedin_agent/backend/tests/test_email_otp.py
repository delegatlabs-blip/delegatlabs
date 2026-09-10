"""AC: email OTP is single-use, expiring, attempt-capped, and hashed at rest (TS-3)."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest


def test_otp_hash_is_not_reversible_and_is_email_bound():
    from app.core.security import hash_otp, verify_otp

    digest = hash_otp("123456", "a@example.com")

    assert "123456" not in digest
    assert len(digest) == 64  # sha256 hex
    assert verify_otp("123456", "a@example.com", digest) is True
    # Same code, different address -> different hash. Stops cross-address replay.
    assert verify_otp("123456", "b@example.com", digest) is False
    assert verify_otp("999999", "a@example.com", digest) is False


def test_generate_otp_respects_configured_length():
    from app.core.security import generate_otp

    for _ in range(20):
        code = generate_otp(6)
        assert len(code) == 6
        assert code.isdigit()


@pytest.mark.asyncio
async def test_verify_rejects_when_no_live_code():
    from app.services import otp as otp_svc

    with (
        patch.object(otp_svc.settings, "OTP_DEV_MODE", False),
        patch.object(otp_svc, "execute_one_raw", new_callable=AsyncMock, return_value=None),
    ):
        assert await otp_svc.verify_and_consume_otp("a@example.com", "123456") is False


@pytest.mark.asyncio
async def test_verify_burns_code_once_attempts_are_exhausted():
    from app.services import otp as otp_svc

    row = {
        "id": "row-1",
        "code_hash": "irrelevant",
        "attempts": 5,
        "max_attempts": 5,
        "expires_at": None,
    }
    with (
        patch.object(otp_svc.settings, "OTP_DEV_MODE", False),
        patch.object(otp_svc, "execute_one_raw", new_callable=AsyncMock, return_value=row),
        patch.object(otp_svc, "execute_raw", new_callable=AsyncMock) as mock_write,
    ):
        assert await otp_svc.verify_and_consume_otp("a@example.com", "123456") is False

    # The exhausted row is consumed so it cannot be ground down further.
    assert mock_write.await_count == 1
    assert "consumed_at = NOW()" in mock_write.await_args.args[0]


@pytest.mark.asyncio
async def test_correct_code_is_consumed_and_cannot_be_replayed():
    from app.core.security import hash_otp
    from app.services import otp as otp_svc

    email = "a@example.com"
    row = {
        "id": "row-1",
        "code_hash": hash_otp("123456", email),
        "attempts": 0,
        "max_attempts": 5,
        "expires_at": None,
    }
    with (
        patch.object(otp_svc.settings, "OTP_DEV_MODE", False),
        patch.object(otp_svc, "execute_one_raw", new_callable=AsyncMock, return_value=row),
        patch.object(otp_svc, "execute_raw", new_callable=AsyncMock) as mock_write,
    ):
        assert await otp_svc.verify_and_consume_otp(email, "123456") is True
    assert "consumed_at = NOW()" in mock_write.await_args.args[0]

    # Second attempt: the row is gone, so the same code fails.
    with patch.object(otp_svc, "execute_one_raw", new_callable=AsyncMock, return_value=None):
        assert await otp_svc.verify_and_consume_otp(email, "123456") is False


@pytest.mark.asyncio
async def test_wrong_code_increments_attempts_without_consuming():
    from app.core.security import hash_otp
    from app.services import otp as otp_svc

    email = "a@example.com"
    row = {
        "id": "row-1",
        "code_hash": hash_otp("123456", email),
        "attempts": 0,
        "max_attempts": 5,
        "expires_at": None,
    }
    with (
        patch.object(otp_svc.settings, "OTP_DEV_MODE", False),
        patch.object(otp_svc, "execute_one_raw", new_callable=AsyncMock, return_value=row),
        patch.object(otp_svc, "execute_raw", new_callable=AsyncMock) as mock_write,
    ):
        assert await otp_svc.verify_and_consume_otp(email, "000000") is False

    assert "attempts = attempts + 1" in mock_write.await_args.args[0]


@pytest.mark.asyncio
async def test_dev_code_is_rejected_when_dev_mode_is_off():
    """OTP_DEV_MODE is the only switch -- NODE_ENV must not open this door."""
    from app.core.security import hash_otp
    from app.services import otp as otp_svc

    email = "a@example.com"
    row = {
        "id": "row-1",
        "code_hash": hash_otp("654321", email),
        "attempts": 0,
        "max_attempts": 5,
        "expires_at": None,
    }
    with (
        patch.object(otp_svc.settings, "OTP_DEV_MODE", False),
        patch.object(otp_svc.settings, "NODE_ENV", "development"),
        patch.object(otp_svc, "execute_one_raw", new_callable=AsyncMock, return_value=row),
        patch.object(otp_svc, "execute_raw", new_callable=AsyncMock),
    ):
        assert await otp_svc.verify_and_consume_otp(email, "123456") is False


@pytest.mark.asyncio
async def test_dev_code_still_requires_an_outstanding_request():
    """Dev mode must not become an unauthenticated 'sign me in as anyone' endpoint."""
    from app.services import otp as otp_svc

    with (
        patch.object(otp_svc.settings, "OTP_DEV_MODE", True),
        patch.object(otp_svc, "execute_one_raw", new_callable=AsyncMock, return_value=None),
        patch.object(otp_svc, "execute_raw", new_callable=AsyncMock),
    ):
        # No code was ever requested for this address -> dev code is not enough.
        assert await otp_svc.verify_and_consume_otp("nobody@example.com", "123456") is False


@pytest.mark.asyncio
async def test_dev_code_accepted_when_a_request_is_outstanding():
    from app.services import otp as otp_svc

    row = {
        "id": "row-1",
        "code_hash": "some-other-hash",
        "attempts": 0,
        "max_attempts": 5,
        "expires_at": None,
    }
    with (
        patch.object(otp_svc.settings, "OTP_DEV_MODE", True),
        patch.object(otp_svc.settings, "OTP_DEV_CODE", "123456"),
        patch.object(otp_svc, "execute_one_raw", new_callable=AsyncMock, return_value=row),
        patch.object(otp_svc, "execute_raw", new_callable=AsyncMock),
    ):
        assert await otp_svc.verify_and_consume_otp("a@example.com", "123456") is True


@pytest.mark.asyncio
async def test_dev_code_cannot_bypass_an_exhausted_attempt_cap():
    """Even in dev mode, a locked-out code stays locked out."""
    from app.services import otp as otp_svc

    row = {
        "id": "row-1",
        "code_hash": "irrelevant",
        "attempts": 5,
        "max_attempts": 5,
        "expires_at": None,
    }
    with (
        patch.object(otp_svc.settings, "OTP_DEV_MODE", True),
        patch.object(otp_svc.settings, "OTP_DEV_CODE", "123456"),
        patch.object(otp_svc, "execute_one_raw", new_callable=AsyncMock, return_value=row),
        patch.object(otp_svc, "execute_raw", new_callable=AsyncMock),
    ):
        assert await otp_svc.verify_and_consume_otp("a@example.com", "123456") is False
