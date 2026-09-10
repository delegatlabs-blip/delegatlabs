import base64
import hashlib
import hmac
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)

IV_LENGTH = 12
TAG_LENGTH = 16

def get_encryption_key() -> bytes:
    return bytes.fromhex(settings.TOKEN_ENC_KEY)

def encrypt(plaintext: str) -> str:
    """
    Encrypts a plaintext string using AES-256-GCM.
    Returns a base64-encoded string: iv(12) + tag(16) + ciphertext
    Identical format to Node.js crypto.ts
    """
    key = get_encryption_key()
    iv = os.urandom(IV_LENGTH)
    aesgcm = AESGCM(key)
    # cryptography AESGCM.encrypt returns ciphertext + tag at the end
    encrypted_and_tag = aesgcm.encrypt(iv, plaintext.encode('utf-8'), None)

    ciphertext = encrypted_and_tag[:-TAG_LENGTH]
    tag = encrypted_and_tag[-TAG_LENGTH:]

    packed = iv + tag + ciphertext
    return base64.b64encode(packed).decode('utf-8')

def decrypt(encoded: str) -> str:
    """
    Decrypts a base64-encoded string produced by encrypt().
    """
    key = get_encryption_key()
    packed = base64.b64decode(encoded)

    iv = packed[:IV_LENGTH]
    tag = packed[IV_LENGTH:IV_LENGTH + TAG_LENGTH]
    ciphertext = packed[IV_LENGTH + TAG_LENGTH:]

    aesgcm = AESGCM(key)
    # AESGCM.decrypt expects ciphertext + tag
    decrypted = aesgcm.decrypt(iv, ciphertext + tag, None)
    return decrypted.decode('utf-8')

def create_admin_jwt(admin_id: str = "owner", expires_days: int = 7) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(days=expires_days)
    payload = {
        "adminId": admin_id,
        "exp": expiration
    }
    return jwt.encode(payload, settings.ADMIN_JWT_SECRET, algorithm="HS256")

def verify_admin_jwt(token: str) -> dict:
    return jwt.decode(token, settings.ADMIN_JWT_SECRET, algorithms=["HS256"])


# =============================================
# User sessions (email / LinkedIn sign-in)
# =============================================
# Distinct from the admin JWT above: that one carries only `adminId` and is shared by
# every browser. These carry a real user id, the active tenant, and a session id so
# logout can revoke server-side.

def create_session_jwt(
    *,
    user_id: str,
    tenant_id: str,
    session_id: str,
    expires_days: Optional[int] = None,
) -> str:
    ttl = settings.SESSION_TTL_DAYS if expires_days is None else expires_days
    payload = {
        "sub": user_id,
        "tid": tenant_id,
        "sid": session_id,
        "typ": "user",
        "exp": datetime.now(timezone.utc) + timedelta(days=ttl),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.user_jwt_secret, algorithm="HS256")


def verify_session_jwt(token: str) -> dict:
    """Decode a user-session JWT. Raises on expiry, bad signature, or wrong token type."""
    payload = jwt.decode(token, settings.user_jwt_secret, algorithms=["HS256"])
    if payload.get("typ") != "user":
        raise jwt.InvalidTokenError("Not a user session token")
    for claim in ("sub", "tid", "sid"):
        if not payload.get(claim):
            raise jwt.InvalidTokenError(f"Session token missing '{claim}'")
    return payload


# =============================================
# OTP hashing
# =============================================
# Codes are only ever persisted as a peppered SHA-256. A 6-digit code has a tiny
# keyspace, so the real defences are the short TTL, the attempt cap, and the rate
# limits in app/services/otp.py -- the hash just keeps live codes out of the table.

def hash_otp(code: str, email: str) -> str:
    """Peppered, email-bound SHA-256. Binding to the email stops a code minted for one
    address being replayed against another."""
    material = f"{settings.otp_pepper}:{email.strip().lower()}:{code}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def verify_otp(code: str, email: str, expected_hash: str) -> bool:
    """Constant-time comparison so a wrong code leaks no timing signal."""
    return hmac.compare_digest(hash_otp(code, email), expected_hash)


def generate_otp(length: Optional[int] = None) -> str:
    """Cryptographically random numeric code, zero-padded to a fixed width."""
    size = length or settings.OTP_LENGTH
    upper = 10**size
    return str(secrets.randbelow(upper)).zfill(size)


# =============================================
# Password hashing
# =============================================
# Argon2id, unlike the OTP's SHA-256 above. The distinction is deliberate: an OTP is a
# short-lived 6-digit secret whose defences are TTL and attempt caps, so a fast hash is
# fine. A password is long-lived, user-chosen, and frequently reused across sites, so it
# needs a slow, memory-hard verifier that stays expensive to attack offline.
#
# argon2-cffi stores the salt and every cost parameter inside the returned string, so no
# separate salt column is needed and parameters can be raised later without a migration.

_password_hasher = PasswordHasher()

# Rejected early rather than at the hasher: Argon2 has no practical length ceiling (unlike
# bcrypt's silent 72-byte truncation), but an unbounded password is a cheap way to burn
# server CPU, since cost scales with input size.
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128


def validate_password(password: str) -> str:
    """Length-check a candidate password, returning it unchanged when acceptable.

    Deliberately length-only -- no character-class rules. Composition requirements push
    people toward predictable mutations ("Password1!") without adding real entropy; length
    plus the slow verifier is the stronger trade.
    """
    if not isinstance(password, str) or not password:
        raise HTTPException(status_code=400, detail="Password is required")
    if len(password) < PASSWORD_MIN_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {PASSWORD_MIN_LENGTH} characters",
        )
    if len(password) > PASSWORD_MAX_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at most {PASSWORD_MAX_LENGTH} characters",
        )
    return password


def hash_password(password: str) -> str:
    """Argon2id verifier for a validated password. Never log or return the result."""
    return _password_hasher.hash(validate_password(password))


def verify_password(password: str, stored_hash: Optional[str]) -> Tuple[bool, Optional[str]]:
    """Check a password, returning (ok, rehashed_or_None).

    The second element is a fresh hash when the stored one used weaker parameters than the
    current policy -- callers should persist it opportunistically on successful login, so
    costs can be raised over time without forcing a reset.

    A user with no password (LinkedIn-only, or pre-009) has stored_hash None. That returns
    False without touching the hasher, so the caller must not treat it as "wrong password"
    in the UI -- it means "this account has no password set".
    """
    if not stored_hash or not password:
        return False, None
    try:
        _password_hasher.verify(stored_hash, password)
    except VerifyMismatchError:
        return False, None
    except InvalidHashError:
        # A malformed verifier is corruption, not a wrong guess. Fail closed and say so,
        # rather than letting it read as an ordinary bad-password attempt.
        logger.warning("Stored password hash is unreadable; treating as no password")
        return False, None
    if _password_hasher.check_needs_rehash(stored_hash):
        return True, _password_hasher.hash(password)
    return True, None
