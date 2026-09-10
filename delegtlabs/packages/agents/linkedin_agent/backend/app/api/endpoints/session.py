"""Customer sign-in and sign-up (user side).

Three ways in, all landing on one user row:

  password  POST /auth/password/login          -- the everyday path
  OTP       POST /auth/email/start -> /verify  -- proves the address at signup, and
                                                  backs /auth/password/forgot -> /reset
  LinkedIn  see endpoints/auth.py              -- shares the OAuth callback with connect

Signup runs OTP first, then /auth/password/set, so an address is always proven before it
carries a password. The OTP endpoints keep working as a standalone sign-in for accounts
created before passwords existed, and for LinkedIn-only users who never set one.

Whether an address is new decides only whether a full name is collected and a workspace
provisioned -- the caller does not choose "signin" vs "signup" up front.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request, Response

from app.api.deps import (
    clear_session_cookies,
    client_ip,
    get_session_claims,
    issue_session_cookie,
)
from app.core.config import settings
from app.core.database import execute_one_raw, execute_raw
from app.schemas.auth import (
    CompleteProfileRequest,
    EmailStartRequest,
    EmailStartResponse,
    EmailVerifyRequest,
    MeResponse,
    PasswordForgotRequest,
    PasswordForgotResponse,
    PasswordLoginRequest,
    PasswordResetRequest,
    PasswordSetRequest,
    PasswordStatusResponse,
    SessionResponse,
    SessionUser,
    TenantSummary,
)
from app.services import users as users_service
from app.services.otp import issue_otp, normalize_email, verify_and_consume_otp

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


async def _session_payload(user: dict, tenant_id: str) -> tuple[SessionUser, TenantSummary]:
    identities = await users_service.list_identities(str(user["id"]))
    membership = await users_service.get_membership(str(user["id"]), tenant_id)
    tenant = await execute_one_raw(
        "SELECT id, name FROM tenants WHERE id = CAST(:tid AS uuid)", {"tid": tenant_id}
    )
    session_user = SessionUser(
        id=str(user["id"]),
        email=user["email"],
        full_name=user.get("full_name"),
        avatar_url=user.get("avatar_url"),
        status=str(user.get("status") or "active"),
        needs_profile=not bool(user.get("full_name")),
        providers=[str(i["provider"]) for i in identities],
    )
    tenant_summary = TenantSummary(
        tenant_id=tenant_id,
        name=(tenant or {}).get("name") or "Workspace",
        role=str((membership or {}).get("role") or "owner"),
    )
    return session_user, tenant_summary


async def _start_session(
    user: dict, request: Request, response: Response, *, is_new_user: bool = False
) -> SessionResponse:
    """Provision-if-needed, open a server-side session, and set the cookie.

    Shared by every email-side entry point (OTP verify, password login, password reset) so
    they cannot drift apart -- a session issued by one is indistinguishable from another.
    """
    if str(user.get("status")) == "suspended":
        raise HTTPException(403, detail="This account has been suspended")

    tenant_id = await users_service.ensure_tenant_for_user(user)
    session_id = await users_service.create_session(
        user_id=str(user["id"]),
        tenant_id=tenant_id,
        user_agent=request.headers.get("User-Agent"),
        ip=client_ip(request),
    )
    issue_session_cookie(
        response, user_id=str(user["id"]), tenant_id=tenant_id, session_id=session_id
    )
    session_user, tenant_summary = await _session_payload(user, tenant_id)
    return SessionResponse(
        ok=True, user=session_user, tenant=tenant_summary, is_new_user=is_new_user
    )


@router.post("/email/start", response_model=EmailStartResponse)
async def email_start(body: EmailStartRequest, request: Request):
    """Send a sign-in code. Works for both new and returning addresses."""
    email = normalize_email(body.email)
    if not users_service.is_valid_email(email):
        raise HTTPException(400, detail="Enter a valid email address")

    existing = await users_service.get_user_by_email(email)
    await issue_otp(email, purpose="signin", request_ip=client_ip(request))

    return EmailStartResponse(
        ok=True,
        is_new=existing is None,
        resend_in_seconds=settings.OTP_RESEND_COOLDOWN_SECONDS,
        dev_mode=settings.OTP_DEV_MODE,
    )


@router.post("/email/verify", response_model=SessionResponse)
async def email_verify(body: EmailVerifyRequest, request: Request, response: Response):
    """Verify the code and start a session, provisioning a workspace for new users."""
    email = normalize_email(body.email)
    if not await verify_and_consume_otp(email, body.code, purpose="signin"):
        raise HTTPException(400, detail="That code is invalid or has expired")

    user, is_new = await users_service.resolve_login(
        provider="email",
        subject=email,
        email=email,
        email_verified=True,
        full_name=(body.full_name or "").strip() or None,
    )

    # A returning user who never finished the profile step can supply the name now.
    if not user.get("full_name") and (body.full_name or "").strip():
        user = await users_service.complete_profile(
            user_id=str(user["id"]), full_name=body.full_name.strip()
        )

    return await _start_session(user, request, response, is_new_user=is_new)


@router.post("/profile", response_model=SessionResponse)
async def complete_profile(
    body: CompleteProfileRequest, request: Request, response: Response
):
    """Set the full name for a user who verified an email but has no name yet."""
    claims = await get_session_claims(request)
    if not claims:
        raise HTTPException(401, detail="Not authenticated")

    user = await users_service.complete_profile(
        user_id=claims["sub"], full_name=body.full_name
    )
    tenant_id = claims["tid"]

    # Name arrived after the workspace was created — retitle it if still the default.
    await execute_raw(
        """
        UPDATE tenants SET name = :name, updated_at = NOW()
        WHERE id = CAST(:tid AS uuid) AND created_by_user_id = CAST(:uid AS uuid)
          AND name = 'My Workspace'
        """,
        {
            "name": users_service.derive_tenant_name(body.full_name, user["email"]),
            "tid": tenant_id,
            "uid": claims["sub"],
        },
    )

    session_user, tenant_summary = await _session_payload(user, tenant_id)
    return SessionResponse(ok=True, user=session_user, tenant=tenant_summary)


@router.get("/me", response_model=MeResponse)
async def me(request: Request):
    """Who is signed in. Returns authenticated=false rather than 401 so the SPA can
    render the sign-in screen without treating it as an error."""
    claims = await get_session_claims(request)
    if not claims:
        return MeResponse(authenticated=False)

    user = await users_service.get_user_by_id(claims["sub"])
    if not user:
        return MeResponse(authenticated=False)

    tenant_id = claims["tid"]
    session_user, tenant_summary = await _session_payload(user, tenant_id)
    memberships = await users_service.list_memberships(claims["sub"])
    return MeResponse(
        authenticated=True,
        user=session_user,
        tenant=tenant_summary,
        tenants=[
            TenantSummary(
                tenant_id=str(m["tenant_id"]), name=m["name"], role=str(m["role"])
            )
            for m in memberships
        ],
    )


@router.post("/signout")
async def signout(request: Request, response: Response):
    """Revoke the session server-side, then clear the cookies."""
    claims = await get_session_claims(request)
    if claims:
        await users_service.revoke_session(claims["sid"])
    clear_session_cookies(response)
    return {"ok": True}


# =============================================
# Password
# =============================================

@router.post("/password/login", response_model=SessionResponse)
async def password_login(
    body: PasswordLoginRequest, request: Request, response: Response
):
    """Everyday sign-in: email + password.

    One message covers every failure. Distinguishing "no such account" from "wrong
    password" -- or from "this account has no password, it signed up with LinkedIn" --
    would let anyone test which addresses are registered, and which of those are
    LinkedIn users, just by watching the copy change.
    """
    email = normalize_email(body.email)
    user = await users_service.authenticate_password(email=email, password=body.password)
    if not user:
        raise HTTPException(401, detail="That email and password do not match")
    return await _start_session(user, request, response)


@router.get("/password/status", response_model=PasswordStatusResponse)
async def password_status(request: Request):
    """Whether the signed-in user has a password yet.

    Drives the "finish setting up your account" prompt for users who arrived via LinkedIn
    or OTP and have no password. Returns has_password=False rather than 401 for an
    anonymous caller, so the sign-in screen can render without special-casing an error.
    """
    claims = await get_session_claims(request)
    if not claims:
        return PasswordStatusResponse(has_password=False)
    return PasswordStatusResponse(
        has_password=await users_service.has_password(claims["sub"])
    )


@router.post("/password/set", response_model=PasswordStatusResponse)
async def password_set(body: PasswordSetRequest, request: Request):
    """Set or change the signed-in user's password.

    This is the last step of signup (the OTP has just proven the address) and also the
    Settings-side change flow. current_password is demanded only when one already exists:
    a LinkedIn-only user has none to give, and requiring it would leave them permanently
    unable to add one.
    """
    claims = await get_session_claims(request)
    if not claims:
        raise HTTPException(401, detail="Not authenticated")

    user = await users_service.get_user_by_id(claims["sub"])
    if not user:
        raise HTTPException(401, detail="Not authenticated")

    if user.get("password_hash"):
        if not body.current_password:
            raise HTTPException(400, detail="Enter your current password to change it")
        confirmed = await users_service.authenticate_password(
            email=str(user["email"]), password=body.current_password
        )
        if not confirmed:
            raise HTTPException(403, detail="Your current password is incorrect")

    await users_service.set_password(user_id=claims["sub"], password=body.password)
    logger.info("Password set for user %s", claims["sub"])
    return PasswordStatusResponse(has_password=True)


@router.post("/password/forgot", response_model=PasswordForgotResponse)
async def password_forgot(body: PasswordForgotRequest, request: Request):
    """Send a reset code -- but answer identically whether or not the address exists.

    An honest 404 here would turn the endpoint into an account-existence oracle, so the
    response shape is fixed and only the side effect differs. The per-email and per-IP
    rate limits inside issue_otp still apply to real addresses; unknown ones do no work.

    The code carries purpose='password_reset', so it cannot be redeemed at
    /auth/email/verify to sign in -- verify_and_consume_otp filters on purpose.
    """
    email = normalize_email(body.email)
    user = await users_service.get_user_by_email(email)
    if user:
        try:
            await issue_otp(
                email=email, purpose="password_reset", request_ip=client_ip(request)
            )
        except HTTPException as exc:
            # issue_otp raises 429 on the resend cooldown and the hourly caps. Letting
            # that surface would undo the whole point of this endpoint: the limits only
            # ever trip for an address that exists, so the error itself would confirm
            # registration. Swallow it -- the caller already got a code moments ago.
            logger.info("Suppressed OTP issue error for known address: %s", exc.detail)
    else:
        logger.info("Password reset requested for unknown address; answering generically")
    return PasswordForgotResponse(
        ok=True,
        resend_in_seconds=settings.OTP_RESEND_COOLDOWN_SECONDS,
        dev_mode=settings.OTP_DEV_MODE,
    )


@router.post("/password/reset", response_model=SessionResponse)
async def password_reset(
    body: PasswordResetRequest, request: Request, response: Response
):
    """Redeem a reset code, set the new password, and sign the user in.

    Every other session for this user is revoked: a reset is the one action that should
    evict whoever may already be holding a stolen session on the account.
    """
    email = normalize_email(body.email)
    if not await verify_and_consume_otp(email, body.code, purpose="password_reset"):
        raise HTTPException(400, detail="That code is invalid or has expired")

    user = await users_service.get_user_by_email(email)
    if not user:
        # Only reachable if the account vanished between issuing and redeeming the code.
        raise HTTPException(400, detail="That code is invalid or has expired")

    await users_service.set_password(user_id=str(user["id"]), password=body.password)
    await users_service.revoke_all_sessions(str(user["id"]))
    logger.info("Password reset completed for user %s", user["id"])
    return await _start_session(user, request, response)
