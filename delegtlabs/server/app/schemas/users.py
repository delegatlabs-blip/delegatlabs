from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel


UserStatus = Literal["active", "invited", "suspended"]


class UserRecord(BaseModel):
    id: str
    name: str
    email: str
    phone: str = ""
    company: str = ""
    role: str = "Viewer"
    status: UserStatus = "active"
    notes: str = ""
    createdAt: str
    updatedAt: str


class UserCreate(BaseModel):
    name: str
    email: str
    phone: str = ""
    company: str = ""
    role: str = "Viewer"
    status: UserStatus = "active"
    notes: str = ""


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    role: str | None = None
    status: UserStatus | None = None
    notes: str | None = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_user(payload: UserCreate) -> UserRecord:
    now = _now()
    return UserRecord(
        id=str(uuid4()),
        name=payload.name.strip(),
        email=str(payload.email).lower(),
        phone=payload.phone,
        company=payload.company,
        role=payload.role,
        status=payload.status,
        notes=payload.notes,
        createdAt=now,
        updatedAt=now,
    )


def row_to_user(row: dict) -> UserRecord:
    return UserRecord(
        id=str(row["id"]),
        name=row["name"],
        email=row["email"],
        phone=row.get("phone") or "",
        company=row.get("company") or "",
        role=row.get("role") or "Viewer",
        status=row.get("status") or "active",
        notes=row.get("notes") or "",
        createdAt=str(row.get("created_at") or _now()),
        updatedAt=str(row.get("updated_at") or _now()),
    )


def user_to_row(user: UserRecord) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "company": user.company,
        "role": user.role,
        "status": user.status,
        "notes": user.notes,
        "created_at": user.createdAt,
        "updated_at": user.updatedAt,
    }
