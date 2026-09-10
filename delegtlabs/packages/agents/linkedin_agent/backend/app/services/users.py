"""User identity, tenant provisioning, and server-side sessions.

The model is deliberately three-layered:

    users            one row per human
      auth_identities  how that human proves who they are (email, linkedin, ...)
      tenant_members   which workspaces they belong to, and in what role

That separation is what lets "sign up by email then connect LinkedIn" and "sign up with
LinkedIn directly" land on the same user row instead of silently forking into two
workspaces.

Tenancy rule: one signup provisions one tenant, with the signer as owner.
"""
from __future__ import annotations

import logging
import re
import secrets
from functools import lru_cache
from typing import Any, Dict, Optional, Tuple

from fastapi import HTTPException

from app.core.config import settings
from app.core.database import execute_one_raw, execute_raw
from app.services.otp import normalize_email

logger = logging.getLogger(__name__)

# Tiers a freshly provisioned workspace starts on. Existing seeded tenants are
# untouched -- 003_saas_rls_seed.sql sets its own tiers for the Default Workspace.
NEW_TENANT_AGENTS = (
    ("post_gen", "free", "trialing"),
    ("lead_gen", "free", "trialing"),
    ("analytics", "free", "trialing"),
)


def derive_tenant_name(full_name: Optional[str], email: str) -> str:
    """'Somya Bhardwaj' -> "Somya's Workspace"; falls back to the email local part."""
    source = (full_name or "").strip()
    if not source:
        source = (email or "").split("@")[0].replace(".", " ").replace("_", " ").strip()
    if not source:
        return "My Workspace"
    first = source.split()[0]
    first = first[:1].upper() + first[1:]
    suffix = "'" if first.endswith("s") else "'s"
    return f"{first}{suffix} Workspace"


def is_valid_email(email: str) -> bool:
    """Deliberately permissive: reject the obviously malformed, let SMTP judge the rest."""
    return bool(re.match(r"^[^@\s]+@[^@\s.]+\.[^@\s]+$", (email or "").strip()))


# =============================================
# Lookups
# =============================================
async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    return await execute_one_raw(
        "SELECT * FROM users WHERE id = CAST(:id AS uuid)", {"id": user_id}
    )


async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    return await execute_one_raw(
        "SELECT * FROM users WHERE LOWER(email) = :email", {"email": normalize_email(email)}
    )


async def get_identity(provider: str, subject: str) -> Optional[Dict[str, Any]]:
    return await execute_one_raw(
        """
        SELECT * FROM auth_identities
        WHERE provider = CAST(:provider AS auth_provider) AND provider_subject = :subject
        """,
        {"provider": provider, "subject": subject},
    )


async def list_identities(user_id: str) -> list[Dict[str, Any]]:
    return await execute_raw(
        """
        SELECT provider, email, email_verified, created_at
        FROM auth_identities WHERE user_id = CAST(:uid AS uuid)
        ORDER BY created_at
        """,
        {"uid": user_id},
    )


# =============================================
# Creation
# =============================================
async def create_user(
    *,
    email: str,
    full_name: Optional[str] = None,
    avatar_url: Optional[str] = None,
    email_verified: bool = False,
) -> Dict[str, Any]:
    email = normalize_email(email)
    row = await execute_one_raw(
        """
        INSERT INTO users (email, full_name, avatar_url, status, email_verified_at)
        VALUES (
          :email, :full_name, :avatar_url,
          CAST(:status AS user_status),
          CASE WHEN :verified THEN NOW() ELSE NULL END
        )
        RETURNING *
        """,
        {
            "email": email,
            "full_name": full_name,
            "avatar_url": avatar_url,
            # A user without a name has not finished signup yet -- the profile step
            # promotes them to 'active'.
            "status": "active" if full_name else "pending",
            "verified": email_verified,
        },
    )
    if not row:
        raise HTTPException(500, detail="Could not create user")
    return row


async def attach_identity(
    *,
    user_id: str,
    provider: str,
    subject: str,
    email: Optional[str] = None,
    email_verified: bool = False,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    import json

    await execute_raw(
        """
        INSERT INTO auth_identities
          (user_id, provider, provider_subject, email, email_verified, metadata)
        VALUES
          (CAST(:uid AS uuid), CAST(:provider AS auth_provider), :subject,
           :email, :verified, CAST(:metadata AS jsonb))
        ON CONFLICT (provider, provider_subject) DO UPDATE SET
          email = COALESCE(EXCLUDED.email, auth_identities.email),
          email_verified = EXCLUDED.email_verified OR auth_identities.email_verified,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
        """,
        {
            "uid": user_id,
            "provider": provider,
            "subject": subject,
            "email": normalize_email(email) if email else None,
            "verified": email_verified,
            "metadata": json.dumps(metadata or {}),
        },
    )


async def provision_tenant(
    *, user: Dict[str, Any], name: Optional[str] = None
) -> Dict[str, Any]:
    """Create a workspace owned by this user, and seed its agent subscriptions."""
    tenant_name = name or derive_tenant_name(user.get("full_name"), user["email"])
    tenant = await execute_one_raw(
        """
        INSERT INTO tenants (name, account_type, subscription_status, created_by_user_id)
        VALUES (:name, 'individual', 'trialing', CAST(:uid AS uuid))
        RETURNING *
        """,
        {"name": tenant_name, "uid": str(user["id"])},
    )
    if not tenant:
        raise HTTPException(500, detail="Could not create workspace")

    tenant_id = str(tenant["id"])
    await execute_raw(
        """
        INSERT INTO tenant_members (tenant_id, user_id, email, display_name, role)
        VALUES (CAST(:tid AS uuid), :uid, :email, :name, 'owner')
        ON CONFLICT (tenant_id, user_id) DO NOTHING
        """,
        {
            "tid": tenant_id,
            "uid": str(user["id"]),
            "email": user["email"],
            "name": user.get("full_name"),
        },
    )

    default_post_gen_plan = await execute_one_raw(
        """
        SELECT id FROM subscription_plans
        WHERE agent_kind = CAST('post_gen' AS agent_kind) AND is_default = true
        LIMIT 1
        """
    )
    default_plan_id = str(default_post_gen_plan["id"]) if default_post_gen_plan else None

    for agent_kind, tier, status in NEW_TENANT_AGENTS:
        plan_id = default_plan_id if agent_kind == "post_gen" else None
        await execute_raw(
            """
            INSERT INTO agent_subscriptions (tenant_id, agent_kind, tier, status, plan_id)
            VALUES (CAST(:tid AS uuid), CAST(:kind AS agent_kind),
                    CAST(:tier AS subscription_tier), CAST(:status AS subscription_status),
                    CAST(:pid AS uuid))
            ON CONFLICT (tenant_id, agent_kind) DO NOTHING
            """,
            {
                "tid": tenant_id,
                "kind": agent_kind,
                "tier": tier,
                "status": status,
                "pid": plan_id,
            },
        )

    logger.info("Provisioned tenant %s for user %s", tenant_id, user["id"])
    return tenant


# =============================================
# Membership
# =============================================
async def get_primary_tenant_id(user_id: str) -> Optional[str]:
    """The workspace a session defaults to: owner rows first, then oldest membership."""
    row = await execute_one_raw(
        """
        SELECT tenant_id FROM tenant_members
        WHERE user_id = :uid
        ORDER BY (role = 'owner') DESC, created_at ASC
        LIMIT 1
        """,
        {"uid": user_id},
    )
    return str(row["tenant_id"]) if row else None


async def get_membership(user_id: str, tenant_id: str) -> Optional[Dict[str, Any]]:
    return await execute_one_raw(
        """
        SELECT * FROM tenant_members
        WHERE user_id = :uid AND tenant_id = CAST(:tid AS uuid)
        """,
        {"uid": user_id, "tid": tenant_id},
    )


async def list_memberships(user_id: str) -> list[Dict[str, Any]]:
    return await execute_raw(
        """
        SELECT tm.tenant_id, tm.role, t.name, t.subscription_status, t.credits_remaining
        FROM tenant_members tm
        JOIN tenants t ON t.id = tm.tenant_id
        WHERE tm.user_id = :uid
        ORDER BY (tm.role = 'owner') DESC, tm.created_at ASC
        """,
        {"uid": user_id},
    )


# =============================================
# Identity resolution -- the heart of "both ways work"
# =============================================
async def resolve_login(
    *,
    provider: str,
    subject: str,
    email: Optional[str],
    email_verified: bool,
    full_name: Optional[str] = None,
    avatar_url: Optional[str] = None,
) -> Tuple[Dict[str, Any], bool]:
    """Map a successful proof-of-identity onto a user row.

    Returns (user, is_new_user). Resolution order:

      1. Known identity (provider + subject) -> that user. Always wins.
      2. Verified email matching an existing user -> attach this identity to them.
         Requires email_verified: an unverified provider assertion must never be
         enough to take over an existing account.
      3. Otherwise -> brand new user.
    """
    email = normalize_email(email) if email else None

    identity = await get_identity(provider, subject)
    if identity:
        user = await get_user_by_id(str(identity["user_id"]))
        if user:
            if avatar_url and user.get("avatar_url") != avatar_url:
                await execute_raw(
                    "UPDATE users SET avatar_url = :avatar WHERE id = :id",
                    {"avatar": avatar_url, "id": user["id"]},
                )
                user = {**user, "avatar_url": avatar_url}
            return user, False
        # Identity orphaned by a deleted user -- fall through and rebuild.
        logger.warning("Orphaned auth_identity %s; recreating user", identity["id"])

    if email and email_verified:
        existing = await get_user_by_email(email)
        if existing:
            await attach_identity(
                user_id=str(existing["id"]),
                provider=provider,
                subject=subject,
                email=email,
                email_verified=True,
            )
            # First verified proof for an account that signed up but never verified.
            if not existing.get("email_verified_at"):
                await execute_raw(
                    "UPDATE users SET email_verified_at = NOW() WHERE id = :id",
                    {"id": existing["id"]},
                )
            logger.info(
                "Linked %s identity to existing user %s via verified email",
                provider,
                existing["id"],
            )
            if avatar_url and existing.get("avatar_url") != avatar_url:
                await execute_raw(
                    "UPDATE users SET avatar_url = :avatar WHERE id = :id",
                    {"avatar": avatar_url, "id": existing["id"]},
                )
                existing = {**existing, "avatar_url": avatar_url}
            return existing, False

    if not email:
        raise HTTPException(
            400,
            detail=(
                "This provider did not return an email address, so the account cannot "
                "be created. Sign up with your email instead."
            ),
        )

    user = await create_user(
        email=email,
        full_name=full_name,
        avatar_url=avatar_url,
        email_verified=email_verified,
    )
    await attach_identity(
        user_id=str(user["id"]),
        provider=provider,
        subject=subject,
        email=email,
        email_verified=email_verified,
    )
    return user, True


async def ensure_tenant_for_user(user: Dict[str, Any]) -> str:
    """Every signed-in user must land in exactly one workspace. Create on first login."""
    tenant_id = await get_primary_tenant_id(str(user["id"]))
    if tenant_id:
        return tenant_id
    tenant = await provision_tenant(user=user)
    return str(tenant["id"])


# =============================================
# Sessions
# =============================================
async def create_session(
    *, user_id: str, tenant_id: str, user_agent: Optional[str], ip: Optional[str]
) -> str:
    row = await execute_one_raw(
        """
        INSERT INTO user_sessions (user_id, tenant_id, user_agent, ip, expires_at)
        VALUES (CAST(:uid AS uuid), CAST(:tid AS uuid), :ua, :ip,
                NOW() + make_interval(days => :ttl))
        RETURNING id
        """,
        {
            "uid": user_id,
            "tid": tenant_id,
            "ua": (user_agent or "")[:500] or None,
            "ip": ip,
            "ttl": settings.SESSION_TTL_DAYS,
        },
    )
    if not row:
        raise HTTPException(500, detail="Could not start session")

    await execute_raw(
        """
        UPDATE users SET last_login_at = NOW(), last_login_ip = :ip
        WHERE id = CAST(:uid AS uuid)
        """,
        {"uid": user_id, "ip": ip},
    )
    return str(row["id"])


async def is_session_active(session_id: str) -> bool:
    """A valid JWT is not enough -- the server-side row must still be live."""
    row = await execute_one_raw(
        """
        SELECT 1 AS ok FROM user_sessions
        WHERE id = CAST(:sid AS uuid) AND revoked_at IS NULL AND expires_at > NOW()
        """,
        {"sid": session_id},
    )
    return bool(row)


async def revoke_all_sessions(user_id: str) -> None:
    """Revoke every live session for a user. Used on password reset, where the point is to
    evict anyone already holding a session on the account."""
    await execute_raw(
        """
        UPDATE user_sessions SET revoked_at = NOW()
        WHERE user_id = CAST(:uid AS uuid) AND revoked_at IS NULL
        """,
        {"uid": user_id},
    )


async def revoke_session(session_id: str) -> None:
    await execute_raw(
        "UPDATE user_sessions SET revoked_at = NOW() WHERE id = CAST(:sid AS uuid) AND revoked_at IS NULL",
        {"sid": session_id},
    )


async def complete_profile(*, user_id: str, full_name: str) -> Dict[str, Any]:
    """Finish signup for a user created by the email flow without a name yet."""
    row = await execute_one_raw(
        """
        UPDATE users
        SET full_name = :name, status = 'active', updated_at = NOW()
        WHERE id = CAST(:uid AS uuid)
        RETURNING *
        """,
        {"uid": user_id, "name": full_name.strip()},
    )
    if not row:
        raise HTTPException(404, detail="User not found")

    await execute_raw(
        "UPDATE tenant_members SET display_name = :name WHERE user_id = :uid AND display_name IS NULL",
        {"uid": user_id, "name": full_name.strip()},
    )
    return row


# =============================================
# Password credentials
# =============================================
# The password lives on the user row, not in auth_identities -- see 009's header. These
# helpers are the only place it is read or written.


@lru_cache(maxsize=1)
def _dummy_password_hash() -> str:
    """A throwaway verifier used to spend the same CPU on an unknown address as on a real
    one. Computed once on first use rather than at import, so module load stays cheap."""
    from app.core.security import hash_password

    return hash_password(secrets.token_urlsafe(32))


async def set_password(*, user_id: str, password: str) -> None:
    """Store an Argon2id verifier for the user. Validation happens in hash_password."""
    from app.core.security import hash_password  # local import avoids a cycle

    await execute_raw(
        """
        UPDATE users
        SET password_hash = :hash, password_set_at = NOW()
        WHERE id = CAST(:uid AS uuid)
        """,
        {"hash": hash_password(password), "uid": user_id},
    )


async def has_password(user_id: str) -> bool:
    row = await execute_one_raw(
        "SELECT password_hash IS NOT NULL AS has FROM users WHERE id = CAST(:uid AS uuid)",
        {"uid": user_id},
    )
    return bool(row and row.get("has"))


async def authenticate_password(*, email: str, password: str) -> Optional[Dict[str, Any]]:
    """Return the user when email+password check out, else None.

    Every failure -- unknown address, no password set, wrong password, suspended account --
    returns None so the caller can answer with one indistinguishable message. Telling them
    apart would turn this endpoint into an account-existence oracle.

    The dummy verify on the unknown-email path is not decoration: without it the response
    time separates "no such user" (one DB hit) from "wrong password" (a full Argon2
    verify), which leaks the same thing the shared message is hiding.
    """
    from app.core.security import verify_password  # local import avoids a cycle

    user = await get_user_by_email(email)
    if not user:
        verify_password(password, _dummy_password_hash())
        return None

    ok, rehashed = verify_password(password, user.get("password_hash"))
    if not ok:
        return None

    if rehashed:
        await execute_raw(
            "UPDATE users SET password_hash = :hash WHERE id = CAST(:uid AS uuid)",
            {"hash": rehashed, "uid": str(user["id"])},
        )
    return user
