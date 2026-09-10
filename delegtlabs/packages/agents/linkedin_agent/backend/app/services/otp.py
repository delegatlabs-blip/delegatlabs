"""Email OTP issuance and verification.

A 6-digit code has only 10^6 possibilities, so the hash is not the defence. The real
controls are all here:

  * TTL              -- OTP_TTL_SECONDS (default 600)
  * attempt cap      -- OTP_MAX_ATTEMPTS per code, then the code is burned
  * single use       -- consumed_at is set on success, and checked on every verify
  * resend cooldown  -- OTP_RESEND_COOLDOWN_SECONDS between sends to one address
  * rate limits      -- per email/hour and per source IP/hour
  * supersede        -- issuing a new code consumes any outstanding one for that address

Dev mode (OTP_DEV_MODE=true) additionally accepts OTP_DEV_CODE. That branch is gated on
the flag alone -- never on NODE_ENV -- so enabling it is always an explicit act.
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import HTTPException

from app.core.config import settings
from app.core.database import execute_one_raw, execute_raw
from app.core.security import generate_otp, hash_otp, verify_otp
from app.services.mailer import send_otp_email

logger = logging.getLogger(__name__)


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


async def _enforce_rate_limits(email: str, request_ip: Optional[str]) -> None:
    """Raises 429 when the caller is over the per-email or per-IP hourly budget."""
    recent = await execute_one_raw(
        """
        SELECT
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') AS in_hour,
          MAX(created_at) AS last_sent
        FROM email_otps
        WHERE LOWER(email) = :email
        """,
        {"email": email},
    )
    in_hour = int((recent or {}).get("in_hour") or 0)
    if in_hour >= settings.OTP_MAX_PER_EMAIL_HOUR:
        raise HTTPException(
            status_code=429,
            detail="Too many codes requested for this email. Try again in an hour.",
        )

    cooldown = await execute_one_raw(
        """
        SELECT 1 AS hit FROM email_otps
        WHERE LOWER(email) = :email
          AND created_at > NOW() - make_interval(secs => :cooldown)
        LIMIT 1
        """,
        {"email": email, "cooldown": settings.OTP_RESEND_COOLDOWN_SECONDS},
    )
    if cooldown:
        raise HTTPException(
            status_code=429,
            detail=(
                f"A code was just sent. Wait {settings.OTP_RESEND_COOLDOWN_SECONDS}s "
                "before requesting another."
            ),
        )

    if request_ip:
        by_ip = await execute_one_raw(
            """
            SELECT COUNT(*) AS in_hour FROM email_otps
            WHERE request_ip = :ip AND created_at > NOW() - INTERVAL '1 hour'
            """,
            {"ip": request_ip},
        )
        if int((by_ip or {}).get("in_hour") or 0) >= settings.OTP_MAX_PER_IP_HOUR:
            raise HTTPException(
                status_code=429,
                detail="Too many codes requested from this network. Try again later.",
            )


async def issue_otp(
    email: str,
    *,
    purpose: str = "signin",
    request_ip: Optional[str] = None,
) -> None:
    """Generate, store, and email a fresh code. Supersedes any outstanding one."""
    email = normalize_email(email)
    await _enforce_rate_limits(email, request_ip)

    # Burn any live code for this address so only the newest one can be used.
    await execute_raw(
        """
        UPDATE email_otps SET consumed_at = NOW()
        WHERE LOWER(email) = :email
          AND purpose = CAST(:purpose AS otp_purpose)
          AND consumed_at IS NULL
        """,
        {"email": email, "purpose": purpose},
    )

    code = generate_otp()
    await execute_raw(
        """
        INSERT INTO email_otps
          (email, code_hash, purpose, max_attempts, expires_at, request_ip)
        VALUES
          (:email, :code_hash, CAST(:purpose AS otp_purpose), :max_attempts,
           NOW() + make_interval(secs => :ttl), :ip)
        """,
        {
            "email": email,
            "code_hash": hash_otp(code, email),
            "purpose": purpose,
            "max_attempts": settings.OTP_MAX_ATTEMPTS,
            "ttl": settings.OTP_TTL_SECONDS,
            "ip": request_ip,
        },
    )

    # Opportunistic cleanup -- keeps the table from growing without a cron job.
    await execute_raw(
        "DELETE FROM email_otps WHERE expires_at < NOW() - INTERVAL '1 day'", {}
    )

    await send_otp_email(email, code)


async def verify_and_consume_otp(
    email: str, code: str, *, purpose: str = "signin"
) -> bool:
    """Check a submitted code and burn it on success.

    Returns True only for a live, unconsumed, correct code. Every wrong guess costs one
    attempt; exhausting max_attempts consumes the row so the code cannot be ground down.
    """
    email = normalize_email(email)
    code = (code or "").strip()

    row = await execute_one_raw(
        """
        SELECT id, code_hash, attempts, max_attempts, expires_at
        FROM email_otps
        WHERE LOWER(email) = :email
          AND purpose = CAST(:purpose AS otp_purpose)
          AND consumed_at IS NULL
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        """,
        {"email": email, "purpose": purpose},
    )

    if not row:
        return False

    # Attempt cap is enforced before every other branch, so the dev code cannot be used
    # to walk past a lockout either.
    if int(row["attempts"]) >= int(row["max_attempts"]):
        await execute_raw(
            "UPDATE email_otps SET consumed_at = NOW() WHERE id = :id", {"id": row["id"]}
        )
        return False

    # Dev bypass requires a live outstanding request, so OTP_DEV_MODE does not turn this
    # into an unauthenticated "log me in as anyone" hole.
    if settings.OTP_DEV_MODE and code == settings.OTP_DEV_CODE:
        await execute_raw(
            "UPDATE email_otps SET consumed_at = NOW() WHERE id = :id", {"id": row["id"]}
        )
        logger.warning("OTP_DEV_MODE: accepted the fixed dev code for %s", email)
        return True

    if not verify_otp(code, email, row["code_hash"]):
        await execute_raw(
            """
            UPDATE email_otps
            SET attempts = attempts + 1,
                consumed_at = CASE WHEN attempts + 1 >= max_attempts THEN NOW() ELSE NULL END
            WHERE id = :id
            """,
            {"id": row["id"]},
        )
        return False

    await execute_raw(
        "UPDATE email_otps SET consumed_at = NOW() WHERE id = :id", {"id": row["id"]}
    )
    return True
