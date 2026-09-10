"""
Pytest bootstrap for linkedin_agent backend unit tests.

Run from the backend package root (so `app` imports resolve):

    cd delegtlabs/packages/agents/linkedin_agent/backend
    python -m pytest tests/ -q

Requires: pytest, pytest-asyncio (not in runtime requirements.txt).
No real LinkedIn or Postgres — DB module is stubbed; services use AsyncMock.

Also acceptable inside Docker backend image after `pip install pytest pytest-asyncio`.
"""
from __future__ import annotations

import sys
import types
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

pytest_plugins = [
    "tests.ts8_helpers",
    "tests.ts10_helpers",
    "tests.ts11_helpers",
    "tests.ts15_helpers",
    "tests.ts16_helpers",
    "tests.ts22_helpers",
]

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# Stub app.core.database before any service import (avoids asyncpg/engine at import time).
_db_stub = types.ModuleType("app.core.database")
_db_stub.execute_raw = AsyncMock(return_value=[])  # type: ignore[attr-defined]
_db_stub.execute_one_raw = AsyncMock(return_value=None)  # type: ignore[attr-defined]
_db_stub.execute_raw_on_session = AsyncMock(return_value=[])  # type: ignore[attr-defined]


class _FakeAsyncSession:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def commit(self):
        return None

    async def rollback(self):
        return None


def _AsyncSessionLocal():
    return _FakeAsyncSession()


_db_stub.AsyncSessionLocal = _AsyncSessionLocal  # type: ignore[attr-defined]
_db_stub.get_db = AsyncMock()  # type: ignore[attr-defined]
_db_stub.engine = None  # type: ignore[attr-defined]
_db_stub.Base = type("Base", (), {})  # type: ignore[attr-defined]


def _ensure_db_stub() -> None:
    # Ensure parent packages exist so we can inject the stub.
    if "app" not in sys.modules:
        import app  # noqa: F401
    if "app.core" not in sys.modules:
        import app.core  # noqa: F401
    sys.modules["app.core.database"] = _db_stub
    import app.core as core_mod

    core_mod.database = _db_stub  # type: ignore[attr-defined]


_ensure_db_stub()


@pytest.fixture(autouse=True)
def _reset_db_stub():
    """Fresh AsyncMocks per test so side_effect / call history do not leak."""
    _db_stub.execute_raw = AsyncMock(return_value=[])
    _db_stub.execute_one_raw = AsyncMock(return_value=None)
    _db_stub.execute_raw_on_session = AsyncMock(return_value=[])
    sys.modules["app.core.database"] = _db_stub
    yield


@pytest.fixture
def tenant_a() -> str:
    return "11111111-1111-1111-1111-111111111111"


@pytest.fixture
def tenant_b() -> str:
    return "22222222-2222-2222-2222-222222222222"


@pytest.fixture
def person_urn() -> str:
    return "urn:li:person:abc123"


@pytest.fixture
def org_urn() -> str:
    return "urn:li:organization:999"


@pytest.fixture
def dest_personal(tenant_a: str, person_urn: str) -> dict:
    return {
        "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "tenant_id": tenant_a,
        "author_urn": person_urn,
        "destination_kind": "personal",
        "display_name": "Alice",
        "is_enabled": True,
        "can_publish": True,
        "role": None,
        "health": "green",
        "last_synced_at": None,
        "archived_at": None,
        "metadata": {},
    }


@pytest.fixture
def dest_org(tenant_a: str, org_urn: str) -> dict:
    return {
        "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        "tenant_id": tenant_a,
        "author_urn": org_urn,
        "destination_kind": "organization",
        "display_name": "Acme Org",
        "is_enabled": True,
        "can_publish": True,
        "role": "ADMINISTRATOR",
        "health": "green",
        "last_synced_at": None,
        "archived_at": None,
        "metadata": {},
    }
