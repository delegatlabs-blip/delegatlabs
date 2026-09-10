"""Role-gated auth helpers for admin vs tenant routes.

Tenancy rule (migration 007 onward): for a signed-in customer the active tenant comes
from their session, and is cross-checked against tenant_members on every request. The
X-Tenant-Id header is honoured ONLY for platform staff, who legitimately act across
tenants.

Before 007 the tenant was read straight off that header for everybody, with no
membership check, so any authenticated caller could act on any tenant by setting it.
"""
from __future__ import annotations

from typing import Optional, Set
from fastapi import Depends, HTTPException, Request, Response

from app.api.deps import get_session_claims, require_auth
from app.services.audit import get_staff, get_tenant_membership, DEFAULT_TENANT_ID


class AuthContext:
    def __init__(
        self,
        user_id: str,
        staff_role: Optional[str] = None,
        tenant_role: Optional[str] = None,
        tenant_id: str = DEFAULT_TENANT_ID,
        session_id: Optional[str] = None,
        is_user_session: bool = False,
    ):
        self.user_id = user_id
        self.staff_role = staff_role
        self.tenant_role = tenant_role
        self.tenant_id = tenant_id
        self.session_id = session_id
        self.is_user_session = is_user_session

    @property
    def is_staff(self) -> bool:
        return self.staff_role is not None

    def require_staff(self, roles: Optional[Set[str]] = None) -> None:
        if not self.is_staff:
            raise HTTPException(403, detail="Platform staff only")
        if roles and self.staff_role not in roles:
            raise HTTPException(403, detail=f"Requires staff role: {', '.join(sorted(roles))}")

    def require_tenant_roles(self, roles: Set[str]) -> None:
        if self.is_staff and self.staff_role in ("tech", "finance"):
            return
        if self.is_user_session:
            # Real customer: the role is whatever tenant_members says, full stop.
            # No default-workspace fallback -- that is what made every caller an owner.
            if self.tenant_role not in roles:
                raise HTTPException(
                    403, detail=f"Requires tenant role: {', '.join(sorted(roles))}"
                )
            return
        # Legacy shared-admin session on the seeded workspace (admin app / DEV_AUTH_BYPASS).
        effective = self.tenant_role or ("owner" if self.tenant_id == DEFAULT_TENANT_ID else None)
        if effective not in roles:
            raise HTTPException(403, detail=f"Requires tenant role: {', '.join(sorted(roles))}")


async def get_auth_context(
    request: Request,
    response: Response,
    user_id: str = Depends(require_auth),
) -> AuthContext:
    claims = await get_session_claims(request)

    if claims:
        from app.services.users import get_membership

        tenant_id = claims["tid"]
        # Staff may pivot to another tenant; a customer may not.
        staff = await get_staff(user_id)
        requested = request.headers.get("X-Tenant-Id")
        if staff and requested:
            tenant_id = requested

        membership = await get_membership(user_id, tenant_id)
        if not membership and not staff:
            raise HTTPException(403, detail="Not a member of this workspace")

        return AuthContext(
            user_id=user_id,
            staff_role=(staff or {}).get("role"),
            tenant_role=(membership or {}).get("role"),
            tenant_id=tenant_id,
            session_id=claims.get("sid"),
            is_user_session=True,
        )

    # Legacy path: admin-app password session, or DEV_AUTH_BYPASS.
    from app.core.config import settings as _settings  # avoid circular at module load

    staff = await get_staff(user_id)
    if not staff and _settings.DEV_AUTH_BYPASS:
        staff = {"role": "tech"}
    tenant_id = request.headers.get("X-Tenant-Id") or DEFAULT_TENANT_ID
    membership = await get_tenant_membership(user_id, tenant_id)
    tenant_role = (membership or {}).get("role")
    if not tenant_role and tenant_id == DEFAULT_TENANT_ID:
        tenant_role = "owner"
    return AuthContext(
        user_id=user_id,
        staff_role=(staff or {}).get("role"),
        tenant_role=tenant_role,
        tenant_id=tenant_id,
        is_user_session=False,
    )
