from __future__ import annotations

from uuid import UUID

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings, settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.domain.tenant.context import TenantContext
from app.utils.exceptions import AppError

_bearer = HTTPBearer(auto_error=False)

# Fixed demo principal used when DISABLE_USER_AUTH=true (local Docker).
_DEMO_TENANT_ID = UUID("11111111-1111-1111-1111-111111111111")
_DEMO_USER_ID = UUID("22222222-2222-2222-2222-222222222222")


def get_current_settings() -> Settings:
    return get_settings()


async def get_current_tenant(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    authorization: str | None = Header(default=None),
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
) -> TenantContext:
    """
    Resolve the authenticated principal and tenant_id from the JWT.

    When DISABLE_USER_AUTH is true, returns a demo tenant context so local
    Docker can exercise tenant-scoped CRUDs without a full login flow.
    """
    if settings.disable_user_auth:
        tenant_id = _DEMO_TENANT_ID
        if x_tenant_id:
            try:
                tenant_id = UUID(x_tenant_id)
            except ValueError as exc:
                raise AppError("Invalid X-Tenant-Id", status_code=400, code="bad_tenant") from exc
        return TenantContext(
            user_id=_DEMO_USER_ID,
            tenant_id=tenant_id,
            email="demo@delegtlabs.com",
            role="Owner",
        )

    token: str | None = None
    if credentials and credentials.scheme.lower() == "bearer":
        token = credentials.credentials
    elif authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise AppError("Authentication required", status_code=401, code="unauthorized")

    try:
        claims = decode_access_token(token)
    except ValueError as exc:
        raise AppError(str(exc), status_code=401, code="invalid_token") from exc

    tenant_raw = claims.get("tenant_id")
    sub = claims.get("sub")
    if not tenant_raw or not sub:
        raise AppError("tenant_id missing from token", status_code=401, code="tenant_required")

    try:
        return TenantContext(
            user_id=UUID(str(sub)),
            tenant_id=UUID(str(tenant_raw)),
            email=str(claims.get("email") or ""),
            role=str(claims.get("role") or "Viewer"),
        )
    except ValueError as exc:
        raise AppError("Malformed token claims", status_code=401, code="invalid_token") from exc


__all__ = ["get_db", "get_current_settings", "get_current_tenant", "Depends"]
