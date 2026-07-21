"""Security helpers (JWT, password hashing) — shared across surfaces."""

from shared.core.config import settings


def get_secret_key() -> str:
    return settings.secret_key
