import os
from typing import Optional
from fastapi import Request, Response, HTTPException
from app.core.config import settings
from app.core.security import (
    create_admin_jwt,
    create_session_jwt,
    verify_admin_jwt,
    verify_session_jwt,
)

_SERVICE_TOKEN = os.environ.get("LINKEDIN_SERVICE_TOKEN", "")

# Latch set on logout so a stale cookie cannot resurrect a session.
LOGGED_OUT_COOKIE = "antgrav_logged_out"
# Legacy shared-admin cookie, still used by the admin app's password login.
ADMIN_COOKIE = "antgrav_token"


def _cookie_secure() -> bool:
    # Only mark Secure when the app is actually served over HTTPS.
    # Local docker uses http://localhost — Secure cookies are dropped by some browsers.
    frontend = (settings.FRONTEND_URL or "").lower()
    return frontend.startswith("https://")


def issue_admin_cookie(response: Response) -> str:
    response.delete_cookie(LOGGED_OUT_COOKIE, path="/")
    token = create_admin_jwt(admin_id="owner")
    response.set_cookie(
        key=ADMIN_COOKIE,
        value=token,
        httponly=True,
        secure=_cookie_secure(),
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    return token


def issue_session_cookie(
    response: Response, *, user_id: str, tenant_id: str, session_id: str
) -> str:
    """Set the real user-session cookie (distinct from the shared admin cookie)."""
    response.delete_cookie(LOGGED_OUT_COOKIE, path="/")
    token = create_session_jwt(
        user_id=user_id, tenant_id=tenant_id, session_id=session_id
    )
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=_cookie_secure(),
        samesite="lax",
        max_age=settings.SESSION_TTL_DAYS * 24 * 60 * 60,
        path="/",
    )
    return token


def clear_session_cookies(response: Response) -> None:
    response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/")
    response.delete_cookie(ADMIN_COOKIE, path="/")
    response.set_cookie(
        key=LOGGED_OUT_COOKIE,
        value="1",
        httponly=True,
        secure=_cookie_secure(),
        samesite="lax",
        max_age=24 * 60 * 60,
        path="/",
    )


def client_ip(request: Request) -> Optional[str]:
    """Left-most X-Forwarded-For hop, else the socket peer.

    Only trustworthy behind a proxy that overwrites the header — nginx does here
    (frontend/*/nginx.conf). Used for rate limiting and audit, never for authorisation.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


async def get_session_claims(request: Request) -> Optional[dict]:
    """Validated user-session claims, or None when there is no usable session.

    Both halves must hold: the JWT verifies AND the server-side row is still live, so
    logout revokes immediately instead of waiting for the token to expire.
    """
    if request.cookies.get(LOGGED_OUT_COOKIE):
        return None
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not token:
        return None
    try:
        claims = verify_session_jwt(token)
    except Exception:
        return None

    from app.services.users import is_session_active  # local import avoids a cycle

    if not await is_session_active(claims["sid"]):
        return None
    return claims


async def require_service_or_auth(request: Request, response: Response) -> str:
    """Accept either a service-to-service token (from integration layer) or the standard cookie auth."""
    service_token = request.headers.get("X-Service-Token", "")
    if _SERVICE_TOKEN and service_token == _SERVICE_TOKEN:
        return "service"
    return await require_auth(request, response)


async def require_auth(request: Request, response: Response) -> str:
    """Return the caller's identity, preferring a real user session.

    Resolution order:
      1. user-session cookie  -> users.id
      2. admin cookie         -> the legacy shared 'owner' identity (admin app)
      3. DEV_AUTH_BYPASS      -> 'dev-admin', minting a cookie on the way out

    Before migration 007 this auto-issued a session to anyone in NODE_ENV=development.
    That now requires DEV_AUTH_BYPASS=true explicitly, so the sign-in flow is what you
    hit by default and a misconfigured deploy cannot silently open the door.
    """
    if request.cookies.get(LOGGED_OUT_COOKIE):
        raise HTTPException(status_code=401, detail="Signed out")

    claims = await get_session_claims(request)
    if claims:
        return claims["sub"]

    token = request.cookies.get(ADMIN_COOKIE)
    if token:
        try:
            payload = verify_admin_jwt(token)
            return payload.get("adminId", "owner")
        except Exception:
            pass

    if settings.DEV_AUTH_BYPASS:
        issue_admin_cookie(response)
        return "dev-admin"

    raise HTTPException(status_code=401, detail="Unauthorized — no valid session")
