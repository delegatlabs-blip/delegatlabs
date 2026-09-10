"""AC: LinkedIn acts as an identity provider, not just a connect button (TS-3).

Exercises the login-intent callback path with LinkedIn's HTTP calls stubbed, so the
sign-in behaviour is proven without a live OAuth round trip.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest


USERINFO = {
    "sub": "li-subject-123",
    "name": "Ada Lovelace",
    "email": "ada@linkedin.example",
    "email_verified": True,
    "picture": "https://media.example/ada.jpg",
}

NEW_USER = {
    "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "email": "ada@linkedin.example",
    "full_name": "Ada Lovelace",
}


@pytest.mark.asyncio
async def test_linkedin_signin_provisions_workspace_and_issues_session():
    from fastapi import Request
    from app.api.endpoints import auth as auth_ep

    tenant_id = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    request = Request({
        "type": "http",
        "headers": [(b"user-agent", b"pytest")],
        "client": ("127.0.0.1", 1234),
        "method": "GET",
        "path": "/auth/linkedin/callback",
        "query_string": b"",
    })

    with (
        patch.object(
            auth_ep.users_service, "resolve_login",
            new_callable=AsyncMock, return_value=(NEW_USER, True),
        ) as resolve,
        patch.object(
            auth_ep.users_service, "ensure_tenant_for_user",
            new_callable=AsyncMock, return_value=tenant_id,
        ) as ensure_tenant,
        patch.object(auth_ep, "persist_connection", new_callable=AsyncMock) as persist,
        patch.object(
            auth_ep.users_service, "create_session",
            new_callable=AsyncMock, return_value="cccccccc-cccc-cccc-cccc-cccccccccccc",
        ),
        patch.object(auth_ep.settings, "FRONTEND_URL", "http://localhost:3005"),
    ):
        redirect = await auth_ep._complete_linkedin_signin(
            request=request,
            userinfo=USERINFO,
            access_token="tok",
            expires_in=5184000,
            frontend_base="http://localhost:3005",
        )

    # Identity resolved from the LinkedIn subject, with the verified-email signal passed through.
    assert resolve.await_args.kwargs["provider"] == "linkedin"
    assert resolve.await_args.kwargs["subject"] == "li-subject-123"
    assert resolve.await_args.kwargs["email_verified"] is True

    # A workspace exists for them, and LinkedIn is connected to it in the same hop.
    ensure_tenant.assert_awaited_once()
    persist.assert_awaited_once()
    assert persist.await_args.kwargs["tenant_id"] == tenant_id

    # The browser goes back to the app, with a real session cookie.
    assert redirect.headers["location"] == "http://localhost:3005/dashboard?auth=success"

    # Two Set-Cookie headers are emitted (clear the signed-out latch, then set the
    # session), so read them all rather than headers.get()'s first match.
    cookies = [
        v.decode() for k, v in redirect.raw_headers if k.decode().lower() == "set-cookie"
    ]
    session_cookie = next((c for c in cookies if c.startswith("antgrav_session=")), None)
    assert session_cookie is not None, f"no session cookie in {cookies}"
    assert "HttpOnly" in session_cookie
    assert "Path=/" in session_cookie


@pytest.mark.asyncio
async def test_linkedin_signin_requires_a_subject():
    from fastapi import HTTPException, Request
    from app.api.endpoints import auth as auth_ep

    request = Request({
        "type": "http", "headers": [], "client": ("127.0.0.1", 1),
        "method": "GET", "path": "/auth/linkedin/callback", "query_string": b"",
    })

    with pytest.raises(HTTPException) as exc:
        await auth_ep._complete_linkedin_signin(
            request=request,
            userinfo={"name": "No Subject"},
            access_token="tok",
            expires_in=1,
            frontend_base="http://localhost:3005",
        )
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_signed_out_login_uses_login_intent():
    """Signed out -> 'login' (provision on return). Signed in -> 'connect'."""
    from fastapi import Request
    from app.api.endpoints import auth as auth_ep

    request = Request({
        "type": "http", "headers": [], "client": ("127.0.0.1", 1),
        "method": "GET", "path": "/auth/linkedin/login", "query_string": b"",
    })

    with patch.object(auth_ep, "get_session_claims", new_callable=AsyncMock, return_value=None):
        assert await auth_ep._oauth_tenant_id(request) is None

    claims = {"sub": "u-1", "tid": "t-1", "sid": "s-1"}
    with patch.object(auth_ep, "get_session_claims", new_callable=AsyncMock, return_value=claims):
        assert await auth_ep._oauth_tenant_id(request) == "t-1"
