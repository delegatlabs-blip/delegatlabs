from typing import List, Optional
from pydantic import BaseModel, Field


class AuthStatusResponse(BaseModel):
    connected: bool
    member_urn: Optional[str] = None
    display_name: Optional[str] = None
    email: Optional[str] = None
    expires_at: Optional[str] = None
    days_to_expiry: Optional[int] = None
    expiry_warning: bool = False
    expired: bool = False


# =============================================
# Email OTP sign-in / sign-up
# =============================================
class EmailStartRequest(BaseModel):
    email: str = Field(..., max_length=320)


class EmailStartResponse(BaseModel):
    ok: bool
    # Whether this address already has an account. Safe to expose here: the flow needs
    # to know whether to ask for a name after verification, and an attacker learns the
    # same thing by watching which screen follows. Rate limits are the real defence.
    is_new: bool
    resend_in_seconds: int
    dev_mode: bool = False


class EmailVerifyRequest(BaseModel):
    email: str = Field(..., max_length=320)
    code: str = Field(..., min_length=4, max_length=12)
    full_name: Optional[str] = Field(default=None, max_length=120)


class TenantSummary(BaseModel):
    tenant_id: str
    name: str
    role: str


class SessionUser(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    status: str
    needs_profile: bool = False
    providers: List[str] = []


class SessionResponse(BaseModel):
    ok: bool
    user: SessionUser
    tenant: TenantSummary
    is_new_user: bool = False


class MeResponse(BaseModel):
    authenticated: bool
    user: Optional[SessionUser] = None
    tenant: Optional[TenantSummary] = None
    tenants: List[TenantSummary] = []


class CompleteProfileRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=120)


# =============================================
# Password credentials
# =============================================
# Bounds mirror app/core/security.py's PASSWORD_MIN/MAX_LENGTH so an obviously bad
# password is rejected at the edge, before it reaches the hasher.

class PasswordLoginRequest(BaseModel):
    email: str = Field(..., max_length=320)
    password: str = Field(..., min_length=1, max_length=128)


class PasswordSetRequest(BaseModel):
    """Set or change the password for the signed-in user.

    current_password is required only when one is already set -- a user who signed up via
    LinkedIn or OTP has none to supply, and demanding it would lock them out of ever
    getting one.
    """
    password: str = Field(..., min_length=8, max_length=128)
    current_password: Optional[str] = Field(default=None, max_length=128)


class PasswordForgotRequest(BaseModel):
    email: str = Field(..., max_length=320)


class PasswordForgotResponse(BaseModel):
    ok: bool
    # Deliberately says nothing about whether the address exists -- see the endpoint.
    resend_in_seconds: int
    dev_mode: bool = False


class PasswordResetRequest(BaseModel):
    email: str = Field(..., max_length=320)
    code: str = Field(..., min_length=4, max_length=12)
    password: str = Field(..., min_length=8, max_length=128)


class PasswordStatusResponse(BaseModel):
    has_password: bool
