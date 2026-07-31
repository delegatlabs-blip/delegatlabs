"""Tenant context extracted from JWT — used on every user-surface request."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True, slots=True)
class TenantContext:
    """Authenticated principal with a mandatory tenant_id claim."""

    user_id: UUID
    tenant_id: UUID
    email: str
    role: str
