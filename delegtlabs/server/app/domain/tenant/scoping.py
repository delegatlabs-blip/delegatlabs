"""
Common tenant helpers — use on EVERY user-surface CRUD.

- `require_tenant_id` — assert JWT carries a tenant
- `apply_tenant_filter` — scope SELECT/UPDATE/DELETE to that tenant
- `stamp_tenant_id` — force tenant_id on creates (never trust the client body)
"""

from __future__ import annotations

from typing import Any, TypeVar
from uuid import UUID

from sqlalchemy import Select, Update, Delete
from sqlalchemy.orm import DeclarativeBase

from app.domain.tenant.context import TenantContext
from app.utils.exceptions import AppError

TStmt = TypeVar("TStmt", Select[Any], Update, Delete)


def require_tenant_id(ctx: TenantContext) -> UUID:
    """Return tenant_id from the JWT context or raise 401."""
    if ctx.tenant_id is None:
        raise AppError("tenant_id missing from token", status_code=401, code="tenant_required")
    return ctx.tenant_id


def apply_tenant_filter(stmt: TStmt, model: type[DeclarativeBase], tenant_id: UUID) -> TStmt:
    """
    Scope a SQLAlchemy statement to rows owned by `tenant_id`.

    Model must expose a `tenant_id` column.
    """
    column = getattr(model, "tenant_id", None)
    if column is None:
        raise AppError(
            f"{model.__name__} is not tenant-scoped (missing tenant_id)",
            status_code=500,
            code="tenant_model_error",
        )
    return stmt.where(column == tenant_id)  # type: ignore[return-value]


def stamp_tenant_id(values: dict[str, Any], tenant_id: UUID) -> dict[str, Any]:
    """
    Stamp JWT tenant_id onto create/update payloads.

    Always overwrites any client-supplied tenant_id so callers cannot
    write into another tenant.
    """
    stamped = dict(values)
    stamped["tenant_id"] = tenant_id
    return stamped


def assert_same_tenant(resource_tenant_id: UUID | None, ctx: TenantContext) -> None:
    """Raise 404 (not 403) when a row belongs to another tenant — avoids leaking existence."""
    if resource_tenant_id is None or resource_tenant_id != ctx.tenant_id:
        raise AppError("Resource not found", status_code=404, code="not_found")
