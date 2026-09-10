"""AC: identity resolution and tenant-per-signup (TS-3).

The linking rule under test: a provider identity attaches to an existing user ONLY when
the provider asserts a verified email that matches. An unverified assertion must never
be enough to take over an account.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest


EXISTING = {
    "id": "11111111-1111-1111-1111-111111111111",
    "email": "ada@example.com",
    "full_name": "Ada Lovelace",
    "email_verified_at": "2026-01-01T00:00:00Z",
}


@pytest.mark.asyncio
async def test_known_identity_returns_its_user_without_email_lookup():
    from app.services import users as users_svc

    identity = {"id": "i-1", "user_id": EXISTING["id"]}
    with (
        patch.object(users_svc, "get_identity", new_callable=AsyncMock, return_value=identity),
        patch.object(users_svc, "get_user_by_id", new_callable=AsyncMock, return_value=EXISTING),
        patch.object(users_svc, "get_user_by_email", new_callable=AsyncMock) as by_email,
    ):
        user, is_new = await users_svc.resolve_login(
            provider="linkedin", subject="li-abc", email="ada@example.com", email_verified=True
        )

    assert user["id"] == EXISTING["id"]
    assert is_new is False
    by_email.assert_not_awaited()


@pytest.mark.asyncio
async def test_verified_email_links_new_provider_to_existing_user():
    from app.services import users as users_svc

    with (
        patch.object(users_svc, "get_identity", new_callable=AsyncMock, return_value=None),
        patch.object(users_svc, "get_user_by_email", new_callable=AsyncMock, return_value=EXISTING),
        patch.object(users_svc, "attach_identity", new_callable=AsyncMock) as attach,
        patch.object(users_svc, "create_user", new_callable=AsyncMock) as create,
        patch.object(users_svc, "execute_raw", new_callable=AsyncMock),
    ):
        user, is_new = await users_svc.resolve_login(
            provider="linkedin",
            subject="li-abc",
            email="ada@example.com",
            email_verified=True,
        )

    assert user["id"] == EXISTING["id"]
    assert is_new is False
    create.assert_not_awaited()
    attach.assert_awaited_once()
    assert attach.await_args.kwargs["provider"] == "linkedin"
    assert attach.await_args.kwargs["user_id"] == EXISTING["id"]


@pytest.mark.asyncio
async def test_unverified_email_does_not_take_over_an_existing_account():
    """The security-critical case: no verified assertion, no linking."""
    from app.services import users as users_svc

    created = {"id": "22222222-2222-2222-2222-222222222222", "email": "ada@example.com"}
    with (
        patch.object(users_svc, "get_identity", new_callable=AsyncMock, return_value=None),
        patch.object(users_svc, "get_user_by_email", new_callable=AsyncMock, return_value=EXISTING) as by_email,
        patch.object(users_svc, "attach_identity", new_callable=AsyncMock),
        patch.object(users_svc, "create_user", new_callable=AsyncMock, return_value=created) as create,
    ):
        user, is_new = await users_svc.resolve_login(
            provider="linkedin",
            subject="li-attacker",
            email="ada@example.com",
            email_verified=False,
        )

    by_email.assert_not_awaited()   # never even consulted without a verified email
    create.assert_awaited_once()
    assert user["id"] == created["id"]
    assert is_new is True


@pytest.mark.asyncio
async def test_unknown_verified_email_creates_a_new_user():
    from app.services import users as users_svc

    created = {"id": "33333333-3333-3333-3333-333333333333", "email": "new@example.com"}
    with (
        patch.object(users_svc, "get_identity", new_callable=AsyncMock, return_value=None),
        patch.object(users_svc, "get_user_by_email", new_callable=AsyncMock, return_value=None),
        patch.object(users_svc, "attach_identity", new_callable=AsyncMock),
        patch.object(users_svc, "create_user", new_callable=AsyncMock, return_value=created),
    ):
        user, is_new = await users_svc.resolve_login(
            provider="email", subject="new@example.com", email="new@example.com", email_verified=True
        )

    assert is_new is True
    assert user["id"] == created["id"]


@pytest.mark.asyncio
async def test_provider_without_an_email_is_rejected():
    from fastapi import HTTPException
    from app.services import users as users_svc

    with (
        patch.object(users_svc, "get_identity", new_callable=AsyncMock, return_value=None),
        patch.object(users_svc, "create_user", new_callable=AsyncMock) as create,
    ):
        with pytest.raises(HTTPException) as exc:
            await users_svc.resolve_login(
                provider="linkedin", subject="li-noemail", email=None, email_verified=False
            )

    assert exc.value.status_code == 400
    create.assert_not_awaited()


@pytest.mark.asyncio
async def test_existing_membership_is_reused_instead_of_provisioning_a_second_tenant():
    from app.services import users as users_svc

    tid = "44444444-4444-4444-4444-444444444444"
    with (
        patch.object(users_svc, "get_primary_tenant_id", new_callable=AsyncMock, return_value=tid),
        patch.object(users_svc, "provision_tenant", new_callable=AsyncMock) as provision,
    ):
        assert await users_svc.ensure_tenant_for_user(EXISTING) == tid
    provision.assert_not_awaited()


@pytest.mark.asyncio
async def test_first_login_provisions_a_tenant():
    from app.services import users as users_svc

    tid = "55555555-5555-5555-5555-555555555555"
    with (
        patch.object(users_svc, "get_primary_tenant_id", new_callable=AsyncMock, return_value=None),
        patch.object(users_svc, "provision_tenant", new_callable=AsyncMock, return_value={"id": tid}) as provision,
    ):
        assert await users_svc.ensure_tenant_for_user(EXISTING) == tid
    provision.assert_awaited_once()


def test_workspace_name_derivation():
    from app.services.users import derive_tenant_name

    assert derive_tenant_name("Ada Lovelace", "ada@example.com") == "Ada's Workspace"
    assert derive_tenant_name(None, "ada.lovelace@example.com") == "Ada's Workspace"
    assert derive_tenant_name("Chris", "c@example.com") == "Chris' Workspace"
    assert derive_tenant_name(None, "") == "My Workspace"


def test_email_validation_rejects_the_obviously_malformed():
    from app.services.users import is_valid_email

    assert is_valid_email("ada@example.com") is True
    assert is_valid_email("ada+tag@sub.example.co.uk") is True
    assert is_valid_email("ada@example") is False
    assert is_valid_email("no-at-sign") is False
    assert is_valid_email("") is False
