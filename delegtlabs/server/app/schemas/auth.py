from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


MemberRole = Literal["Owner", "Admin", "Editor", "Viewer"]
MemberStatus = Literal["active", "invited", "suspended"]


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=1)


class RegisterRequest(BaseModel):
    tenant_name: str = Field(min_length=2, max_length=120)
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=3)
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: str
    user_id: str
    email: str
    role: str
    name: str


class MemberRead(BaseModel):
    id: str
    tenant_id: str
    name: str
    email: str
    role: str
    status: MemberStatus
    department: str = ""
    notes: str = ""
    last_login_at: str | None = None
    created_at: str
    updated_at: str


class MemberCreate(BaseModel):
    name: str = Field(min_length=2)
    email: str = Field(min_length=3)
    role: MemberRole = "Viewer"
    status: MemberStatus = "invited"
    department: str = ""
    notes: str = ""
    password: str | None = Field(default=None, min_length=8, max_length=128)


class MemberUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    role: MemberRole | None = None
    status: MemberStatus | None = None
    department: str | None = None
    notes: str | None = None
