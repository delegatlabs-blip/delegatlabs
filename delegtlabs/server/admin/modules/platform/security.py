from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException, Request, status
from jose import jwt
from jose.exceptions import JWTError

from shared.core.config import settings


@dataclass
class AdminPrincipal:
    user_id: str
    email: str | None
    role: str
    claims: dict[str, Any]


_jwks_cache: dict[str, Any] | None = None


async def _get_jwks() -> dict[str, Any]:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(settings.supabase_jwks_url)
    response.raise_for_status()
    _jwks_cache = response.json()
    return _jwks_cache


async def verify_admin_token(token: str) -> AdminPrincipal:
    jwks = await _get_jwks()
    try:
        claims = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=settings.supabase_jwt_issuer,
            audience=settings.supabase_jwt_audience,
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid JWT") from exc

    role = claims.get("role")
    if role != settings.admin_required_role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")

    return AdminPrincipal(
        user_id=str(claims.get("sub", "")),
        email=claims.get("email"),
        role=role,
        claims=claims,
    )


async def get_admin_principal(request: Request) -> AdminPrincipal:
    principal = getattr(request.state, "admin_principal", None)
    if principal is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    return principal
