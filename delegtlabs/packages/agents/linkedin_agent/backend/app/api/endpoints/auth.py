import math
import urllib.parse
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from app.core.config import settings
from app.core.security import encrypt, verify_admin_jwt
from app.core.database import execute_raw
from app.api.deps import (
    clear_session_cookies,
    client_ip,
    get_session_claims,
    issue_admin_cookie,
    issue_session_cookie,
)
from app.api.auth_context import AuthContext, get_auth_context
from app.services.audit import DEFAULT_TENANT_ID
from app.services.linkedin import (
    consume_oauth_state,
    exchange_code,
    get_auth_url,
    get_stored_account,
    persist_connection,
)
from app.services import users as users_service
from app.services.linkedin_destinations import (
    disconnect_linkedin,
    enabled_publishable_count,
    list_destinations,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _frontend_base() -> str:
    """Where to send the browser after an OAuth round trip.

    Deliberately config-only. The callback arrives as a navigation from the identity
    provider, so its Referer names the provider, not this app.
    """
    return (settings.FRONTEND_URL or "http://localhost:3005").rstrip("/")


async def _oauth_tenant_id(request: Request) -> Optional[str]:
    """Tenant to bind a connect flow to, taken from the user session -- never from a
    header, and never from the admin cookie.

    Returns None when there is no signed-in customer, which the caller turns into a
    'login' intent instead of silently connecting LinkedIn to the seeded workspace.

    The admin cookie (antgrav_token) is deliberately NOT consulted. It is shared by
    every browser, carries no user identity, and -- because cookies ignore port --
    leaks from the admin app on :3006 to the user app on :3005. Honouring it here sent
    every signed-out "Sign in with LinkedIn" down the connect branch, which persists an
    account but issues no user session, so /me answered authenticated=false and the SPA
    bounced back to /signin.
    """
    claims = await get_session_claims(request)
    if claims:
        return claims["tid"]
    return None


@router.get("/linkedin/login")
async def linkedin_login(request: Request):
    """
    Start LinkedIn OAuth. Clears the signed-out latch so reconnect works after logout.
    Tenant binding uses the existing session when present; otherwise DEFAULT_TENANT_ID.
    """
    if not settings.LINKEDIN_CLIENT_ID:
        from fastapi.responses import JSONResponse

        return JSONResponse(
            status_code=500,
            content={
                "detail": (
                    "LINKEDIN_CLIENT_ID is not configured in the backend environment. "
                    "Set it in packages/agents/linkedin_agent/.env (or backend/.env) "
                    "and recreate the container."
                )
            },
        )
    tid = await _oauth_tenant_id(request)
    # Signed in -> connect LinkedIn to that workspace.
    # Signed out -> this is a sign-in; the workspace is provisioned after LinkedIn
    # tells us who the person is.
    intent = "connect" if tid else "login"
    url = await get_auth_url(tid, intent=intent)
    redirect = RedirectResponse(url=url)
    redirect.delete_cookie("antgrav_logged_out", path="/")
    return redirect


@router.get("/dev-connect")
async def dev_connect(request: Request, response: Response):
    """Local mock LinkedIn connect — issues a session cookie without contacting LinkedIn.

    Gated on DEV_AUTH_BYPASS: this hands out an authenticated session to whoever calls
    it, so it must never be reachable on a real deployment.
    """
    if not settings.DEV_AUTH_BYPASS:
        raise HTTPException(status_code=404, detail="Not found")
    tid = await _oauth_tenant_id(request) or DEFAULT_TENANT_ID
    encrypted_token = encrypt("mock_access_token_dev")

    # Upsert by tenant active row (migration 006 tenant_id + disconnected_at).
    existing = await execute_raw(
        """
        SELECT id FROM linkedin_accounts
        WHERE tenant_id = CAST(:tid AS uuid) AND disconnected_at IS NULL
        LIMIT 1
        """,
        {"tid": tid},
    )
    if existing:
        await execute_raw(
            """
            UPDATE linkedin_accounts
            SET member_urn = 'urn:li:person:dev_local_user',
                display_name = 'Local Dev Account',
                email = 'dev@local.test',
                access_token_enc = :token,
                expires_at = NOW() + INTERVAL '60 days',
                disconnected_at = NULL,
                updated_at = NOW()
            WHERE id = :id
            """,
            {"token": encrypted_token, "id": existing[0]["id"]},
        )
    else:
        await execute_raw(
            """
            INSERT INTO linkedin_accounts (
              tenant_id, member_urn, display_name, email, access_token_enc, expires_at, disconnected_at
            )
            VALUES (
              CAST(:tid AS uuid), 'urn:li:person:dev_local_user', 'Local Dev Account',
              'dev@local.test', :token, NOW() + INTERVAL '60 days', NULL
            )
            """,
            {"tid": tid, "token": encrypted_token},
        )

    redirect_res = RedirectResponse(url=f"{_frontend_base()}/dashboard?auth=success")
    issue_admin_cookie(redirect_res)
    return redirect_res


@router.get("/linkedin/callback")
async def linkedin_callback(
    request: Request,
    response: Response,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
):
    # Always the configured frontend -- never the Referer. This request is a browser
    # navigation FROM linkedin.com, so its Referer is linkedin.com; trusting it sent
    # users to https://www.linkedin.com/dashboard after a successful sign-in, and let
    # any referer-controlling party pick the post-auth redirect target.
    frontend_base = _frontend_base()

    if error:
        msg = urllib.parse.quote(error_description or error)
        return RedirectResponse(url=f"{frontend_base}/dashboard?auth_error={msg}")

    if not code or not state:
        return RedirectResponse(url=f"{frontend_base}/dashboard?auth_error=missing_params")

    try:
        valid, tenant_id, intent = await consume_oauth_state(state)
        if not valid:
            if settings.NODE_ENV != "development":
                raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")
            tenant_id, intent = DEFAULT_TENANT_ID, "connect"

        access_token, expires_in, userinfo = await exchange_code(code)

        if intent == "login":
            redirect_res = await _complete_linkedin_signin(
                request=request,
                userinfo=userinfo,
                access_token=access_token,
                expires_in=expires_in,
                frontend_base=frontend_base,
            )
            return redirect_res

        assert tenant_id is not None
        await persist_connection(
            tenant_id=tenant_id,
            access_token=access_token,
            expires_in=expires_in,
            userinfo=userinfo,
        )
        redirect_res = RedirectResponse(url=f"{frontend_base}/dashboard?auth=success")
        # Legacy admin cookie retained so the admin app's flow is unchanged.
        issue_admin_cookie(redirect_res)
        return redirect_res
    except Exception as err:
        msg = urllib.parse.quote(str(err))
        return RedirectResponse(url=f"{frontend_base}/signin?auth_error={msg}")


async def _complete_linkedin_signin(
    *,
    request: Request,
    userinfo: dict,
    access_token: str,
    expires_in: int,
    frontend_base: str,
) -> RedirectResponse:
    """LinkedIn as the identity provider: resolve the user, provision on first visit,
    then attach the connection to the workspace they landed in.

    Account linking (confirmed decision): a LinkedIn identity is attached to an existing
    user only when LinkedIn asserts email_verified for a matching address. Unverified
    assertions fall through to a new account -- see users_service.resolve_login.
    """
    sub = userinfo.get("sub")
    if not sub:
        raise HTTPException(400, detail="LinkedIn did not return a user identifier")

    user, _is_new = await users_service.resolve_login(
        provider="linkedin",
        subject=str(sub),
        email=userinfo.get("email"),
        email_verified=bool(userinfo.get("email_verified")),
        full_name=userinfo.get("name"),
        avatar_url=userinfo.get("picture"),
    )
    tenant_id = await users_service.ensure_tenant_for_user(user)

    # Signing in with LinkedIn also connects it, so the dashboard is usable immediately.
    await persist_connection(
        tenant_id=tenant_id,
        access_token=access_token,
        expires_in=expires_in,
        userinfo=userinfo,
    )

    session_id = await users_service.create_session(
        user_id=str(user["id"]),
        tenant_id=tenant_id,
        user_agent=request.headers.get("User-Agent"),
        ip=client_ip(request),
    )
    redirect_res = RedirectResponse(url=f"{frontend_base}/dashboard?auth=success")
    issue_session_cookie(
        redirect_res,
        user_id=str(user["id"]),
        tenant_id=tenant_id,
        session_id=session_id,
    )
    return redirect_res


@router.post("/linkedin/disconnect")
async def linkedin_disconnect(ctx: AuthContext = Depends(get_auth_context)):
    ctx.require_tenant_roles({"owner", "admin"})
    return await disconnect_linkedin(ctx.tenant_id)


@router.get("/status")
async def auth_status(ctx: AuthContext = Depends(get_auth_context)):
    tid = ctx.tenant_id
    account = await get_stored_account(tid)
    dest_count = len(await list_destinations(tid))
    enabled_count = await enabled_publishable_count(tid)

    if not account:
        return {
            "connected": False,
            "member_urn": None,
            "display_name": None,
            "email": None,
            "expires_at": None,
            "days_to_expiry": None,
            "expiry_warning": False,
            "expired": False,
            "tenant_id": tid,
            "destination_count": dest_count,
            "enabled_publishable_count": enabled_count,
        }

    now_ms = datetime.now(timezone.utc).timestamp() * 1000
    exp_dt = account["expires_at"]
    if isinstance(exp_dt, str):
        exp_dt = datetime.fromisoformat(exp_dt.replace("Z", "+00:00"))
    if exp_dt.tzinfo is None:
        exp_dt = exp_dt.replace(tzinfo=timezone.utc)

    expires_ms = exp_dt.timestamp() * 1000
    days_to_expiry = math.floor((expires_ms - now_ms) / (1000 * 60 * 60 * 24))
    expired = days_to_expiry < 0
    warn_days = 7

    return {
        "connected": not expired,
        "member_urn": account.get("member_urn"),
        "display_name": account.get("display_name"),
        "email": account.get("email"),
        "expires_at": exp_dt.isoformat(),
        "days_to_expiry": days_to_expiry,
        "expiry_warning": (days_to_expiry >= 0 and days_to_expiry <= warn_days),
        "expired": expired,
        "tenant_id": tid,
        "destination_count": dest_count,
        "enabled_publishable_count": enabled_count,
    }


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Clear both cookie families and revoke the server-side session row."""
    claims = await get_session_claims(request)
    if claims:
        await users_service.revoke_session(claims["sid"])
    clear_session_cookies(response)
    return {"ok": True}


@router.post("/admin-login")
async def admin_login(request: Request, response: Response):
    """Password-based admin login. Ensures a platform_staff row exists, then issues a cookie.

    The admin app and the customer app share a bare 'localhost' cookie domain in local
    dev (different ports, same host), so a lingering customer session cookie in the same
    browser would otherwise take priority over the admin cookie in require_auth/
    get_auth_context and silently deny staff access. Evict it here so admin login always
    wins in that browser, regardless of what the same browser is signed into on the
    customer app.
    """
    body = await request.json()
    password = (body.get("password") or "").strip()
    if not password or password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")
    response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/")
    await execute_raw(
        """
        INSERT INTO platform_staff (user_id, email, display_name, role, is_active)
        VALUES ('owner', 'admin@platform.local', 'Platform Admin', 'tech', true)
        ON CONFLICT (user_id) DO NOTHING
        """,
        {},
    )
    issue_admin_cookie(response)
    return {"ok": True, "role": "tech"}


@router.get("/admin-me")
async def admin_me(request: Request, response: Response):
    """Returns admin identity if the session cookie is valid and the user has staff access."""
    if request.cookies.get("antgrav_logged_out"):
        raise HTTPException(status_code=401, detail="Signed out")

    token = request.cookies.get("antgrav_token")
    if not token:
        if settings.DEV_AUTH_BYPASS:
            issue_admin_cookie(response)
            return {"ok": True, "user_id": "dev-admin", "role": "tech", "dev_mode": True}
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = verify_admin_jwt(token)
        user_id = payload.get("adminId", "owner")
    except Exception:
        if settings.DEV_AUTH_BYPASS:
            issue_admin_cookie(response)
            return {"ok": True, "user_id": "dev-admin", "role": "tech", "dev_mode": True}
        raise HTTPException(status_code=401, detail="Invalid session")
    from app.services.audit import get_staff

    staff = await get_staff(user_id)
    if not staff:
        if settings.DEV_AUTH_BYPASS:
            return {"ok": True, "user_id": user_id, "role": "tech", "dev_mode": True}
        raise HTTPException(status_code=403, detail="Not a platform staff member")
    return {"ok": True, "user_id": user_id, "role": staff["role"], "dev_mode": False}
