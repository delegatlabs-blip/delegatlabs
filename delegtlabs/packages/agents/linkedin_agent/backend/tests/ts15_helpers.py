"""TS-15 helpers from C-persona-topics (+ schema). Gemini AsyncMock; no real Postgres."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Optional
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.auth_context import AuthContext, get_auth_context
from app.api.deps import require_auth
from app.services.adaptive_onboarding.schema import ContentDNA, SessionState
from tests.ts10_helpers import _ensure_posts_import_stubs
from tests.ts11_helpers import glob_text, read_text, viewer_ctx, wc_l
from tests.ts8_helpers import close_client, tenant_ctx
from tests.ts15_store import TopicStore, default_catalog

BACKEND_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_ROOT = BACKEND_ROOT.parent / "frontend"
USER_SRC = FRONTEND_ROOT / "user" / "src"
SHARED = FRONTEND_ROOT / "shared"
_EP = BACKEND_ROOT / "app" / "api" / "endpoints"
_SVC = BACKEND_ROOT / "app" / "services"
_ONB = FRONTEND_ROOT / "shared" / "components" / "onboarding"
TOPICS_PY = _EP / "topics.py"
ONBOARDING_ADAPTIVE_PY = _EP / "onboarding_adaptive.py"
ONBOARDING_PY = _EP / "onboarding.py"
GEMINI_PY = _SVC / "gemini.py"
GEMINI_PERSONA_PY = _SVC / "gemini_persona_topics.py"
GENERATION_PY = _SVC / "generation.py"
SCHEMAS_TOPIC_PY = BACKEND_ROOT / "app" / "schemas" / "topic.py"
CONFIG_PY = BACKEND_ROOT / "app" / "core" / "config.py"
ENV_EXAMPLE = BACKEND_ROOT / ".env.example"
MIGRATIONS_DIR = BACKEND_ROOT / "app" / "db" / "migrations"
MIGRATION_016 = MIGRATIONS_DIR / "016_topics_persona_options.sql"
ROLLBACK_016 = BACKEND_ROOT / "app" / "db" / "rollbacks" / "016_topics_persona_options_rollback.sql"
APP_TSX = USER_SRC / "App.tsx"
TOPICS_TSX = USER_SRC / "pages" / "Topics.tsx"
TOPIC_ROW_TSX = USER_SRC / "pages" / "TopicRow.tsx"
ONBOARDING_PAGE = USER_SRC / "pages" / "Onboarding.tsx"
FLASHCARD = _ONB / "FlashcardFlow.tsx"
SUMMARY_CARD = _ONB / "SummaryCard.tsx"
ONBOARDING_STATUS = _ONB / "onboarding-status.ts"
TOPICS_PERSONA_TS = SHARED / "api" / "topics-persona.ts"
API_INDEX = SHARED / "api" / "index.ts"

GENERATE_PERSONA = "/topics/generate-persona"
TOPICS_PATH = "/topics"
UNAUTH_DETAIL = "Unauthorized — no valid session"
ROLE_DETAIL = "Requires tenant role: admin, editor, owner"
SESSION_NOT_COMPLETED = "Adaptive session is not completed"
OPTION_MATCH_DETAIL = "selected_option_value must match an option value"
OPTION_REQUIRED_DETAIL = "selected_option_value is required when is_active is true"
TOPIC_NOT_FOUND = "Topic not found"
WEIGHT_DETAIL = "Weight must be 0–1"
NO_ACTIVE_DETAIL = "No active topics found"
GEMINI_KEY_DETAIL = "GEMINI_API_KEY is not configured in environment variables"
INDEX_TS_MAX = 655
FILE_MAX = 500
TIMEOUT_MS = 120000
TENANT_B = "22222222-2222-2222-2222-222222222222"

TOPIC_JSON_KEYS = (
    "id", "name", "slug", "weight", "is_active", "published_count", "avg_score",
    "created_at", "updated_at", "persona_generated", "selected_option_value", "options",
)
FORBIDDEN_GENERATE_KEYS = ("post", "postError", "promptUsed", "text")
COPY_PAGE = "Edit your content persona or manage topic status (many topics can be Active)"
COPY_WEIGHTS = (
    "Topics start as Draft. Toggle any number to Active. Unselected stay Draft. "
    "Pick exactly one option per topic."
)
COPY_GENERATE = "Generate My First Posts"
COPY_HELPER = "Activate at least one topic on Topic Weights first."
ARIA_ON = "Set topic active"
ARIA_DRAFT = "Set topic to draft"
FORBIDDEN_ARIA = "Set topic active (only one at a time)"
NAV_WEIGHTS = "/topics?tab=weights"
ERR_FALLBACK = "Could not generate topics"

_DB_MODULES = (
    "app.core.database",
    "app.api.endpoints.topics",
    "app.services.generation",
    "app.services.adaptive_onboarding.persistence",
    "app.api.endpoints.onboarding_adaptive",
    "app.api.endpoints.onboarding",
)


def tenant_b_ctx() -> AuthContext:
    return AuthContext(
        user_id="user-tenant-b",
        staff_role=None,
        tenant_role="owner",
        tenant_id=TENANT_B,
        session_id="sid-tenant-b",
        is_user_session=True,
    )


def py_function_source(src: str, name: str) -> str:
    m = re.search(rf"^(async )?def {re.escape(name)}\(", src, re.M)
    if not m:
        return ""
    nxt = re.search(r"^(async )?def ", src[m.end() :], re.M)
    return src[m.start() : (m.end() + nxt.start() if nxt else len(src))]


def ts_function_source(src: str, name: str) -> str:
    m = re.search(rf"function {re.escape(name)}\(", src)
    if not m:
        return ""
    nxt = re.search(r"\nfunction ", src[m.end() :])
    return src[m.start() : (m.end() + nxt.start() if nxt else len(src))]


def require_file(path, msg: str) -> None:
    if not path.is_file():
        pytest.fail(msg)


def topics_ui_blob() -> str:
    return "\n".join(
        [
            read_text(TOPICS_TSX),
            read_text(TOPIC_ROW_TSX),
            read_text(SUMMARY_CARD),
            read_text(TOPICS_PERSONA_TS),
        ]
    )


def assert_topic_json(obj: dict, *, persona: Optional[bool] = None, n_options: Optional[int] = None) -> None:
    assert isinstance(obj, dict)
    for key in TOPIC_JSON_KEYS:
        assert key in obj, f"topic JSON missing {key}"
    assert isinstance(obj["options"], list)
    if persona is True:
        assert obj["persona_generated"] is True
        assert len(obj["options"]) == 5
        seen = set()
        for opt in obj["options"]:
            assert isinstance(opt, dict)
            assert str(opt.get("value") or "").strip()
            assert str(opt.get("label") or "").strip()
            seen.add(opt["value"])
        assert len(seen) == 5
    if persona is False:
        assert obj["persona_generated"] is False
        assert obj["options"] == []
        assert obj["selected_option_value"] is None
    if n_options is not None:
        assert len(obj["options"]) == n_options


def assert_generate_success(body: dict) -> None:
    assert body.get("ok") is True
    topics = body.get("topics")
    assert isinstance(topics, list)
    assert len(topics) == 10
    names = [t["name"] for t in topics]
    assert len(set(names)) == 10
    for t in topics:
        assert_topic_json(t, persona=True, n_options=5)
        assert t["is_active"] is False or t["selected_option_value"] is not None
    for key in FORBIDDEN_GENERATE_KEYS:
        assert key not in body



def _install_store(store: TopicStore, extra: Optional[list] = None) -> list:
    async def raw(sql: str, params: Optional[dict] = None):
        return store.exec(sql, params)

    async def one(sql: str, params: Optional[dict] = None):
        rows = store.exec(sql, params)
        return rows[0] if rows else None

    async def raw_on_session(*args, **kwargs):
        shifted = args and not isinstance(args[0], str)
        sql = (args[1] if shifted else args[0]) if args else kwargs.get("sql", "")
        params = (args[2] if shifted and len(args) > 2 else args[1] if not shifted and len(args) > 1 else kwargs.get("params"))
        return store.exec(sql, params)

    pairs = (("execute_raw", raw), ("execute_one_raw", one), ("execute_raw_on_session", raw_on_session))
    started = []
    for obj in extra or []:
        for attr, fn in pairs:
            if obj is not None and hasattr(obj, attr):
                p = patch.object(obj, attr, new=AsyncMock(side_effect=fn))
                p.start()
                started.append(p)
    for mod in _DB_MODULES:
        try:
            imported = __import__(mod, fromlist=["execute_raw"])
        except Exception:
            continue
        for attr, fn in pairs:
            if hasattr(imported, attr):
                p = patch(f"{mod}.{attr}", new=AsyncMock(side_effect=fn))
                p.start()
                started.append(p)
    return started

def _make_topics_app(persona_mock: AsyncMock, *, session_status: str = "completed") -> FastAPI:
    _ensure_posts_import_stubs()
    sys.modules.pop("app.api.endpoints.topics", None)
    from app.api.endpoints import topics as topics_mod
    app = FastAPI()
    app.include_router(topics_mod.router)
    app.state._topics_mod = topics_mod
    app.state.persona_mock = persona_mock
    profile = ContentDNA(primary_domain="engineering", profession="engineer")
    app.state.profile = profile
    app.state.migrate_mock = AsyncMock(return_value=(profile, SessionState(status=session_status)))
    return app


def _bind_persona_patches(app: FastAPI, persona_mock: AsyncMock) -> list:
    patches = []
    topics_mod = getattr(app.state, "_topics_mod", None)
    migrate = getattr(app.state, "migrate_mock", None)
    targets = [
        (topics_mod, "generate_persona_topic_catalog", persona_mock),
        (sys.modules.get("app.services.gemini_persona_topics"), "generate_persona_topic_catalog", persona_mock),
        (topics_mod, "get_or_migrate", migrate),
        (sys.modules.get("app.services.adaptive_onboarding.persistence"), "get_or_migrate", migrate),
    ]
    for obj, name, repl in targets:
        if obj is not None and repl is not None and hasattr(obj, name):
            patches.append(patch.object(obj, name, repl))
    return patches


def _client(app: FastAPI, *, authed: bool, ctx: Optional[AuthContext] = None) -> TestClient:
    from app.core.config import settings

    app.dependency_overrides.clear()
    if authed:
        auth_ctx = ctx if ctx is not None else tenant_ctx()

        async def _uid() -> str:
            return auth_ctx.user_id

        async def _ctx():
            return auth_ctx

        app.dependency_overrides[require_auth] = _uid
        app.dependency_overrides[get_auth_context] = _ctx

    persona_mock = getattr(app.state, "persona_mock", AsyncMock(return_value=default_catalog()))
    patches = [patch.object(settings, "DEV_AUTH_BYPASS", False)]
    patches.extend(_bind_persona_patches(app, persona_mock))
    for p in patches:
        p.start()
    client = TestClient(app)
    client._ts8_patches = patches
    client._persona_mock = persona_mock
    return client


def set_session_status(app: FastAPI, status: str) -> None:
    profile = getattr(app.state, "profile", ContentDNA())
    app.state.migrate_mock.return_value = (profile, SessionState(status=status))

@pytest.fixture
def topic_store():
    return TopicStore.seeded()


@pytest.fixture
def persona_mock():
    return AsyncMock(return_value=default_catalog())


@pytest.fixture
def topics_app(topic_store, persona_mock):
    app = _make_topics_app(persona_mock)
    patches = _install_store(topic_store, extra=[getattr(app.state, "_topics_mod", None)])
    app.state._store_patches = patches
    yield app
    for p in patches:
        p.stop()


def _authed(topics_app, **kwargs):
    c = _client(topics_app, **kwargs)
    yield c
    close_client(c)


@pytest.fixture
def topics_client(topics_app):
    yield from _authed(topics_app, authed=True)


@pytest.fixture
def topics_anon_client(topics_app):
    yield from _authed(topics_app, authed=False)


@pytest.fixture
def topics_viewer_client(topics_app):
    yield from _authed(topics_app, authed=True, ctx=viewer_ctx())


@pytest.fixture
def topics_tenant_b_client(topic_store, persona_mock):
    """Own FastAPI app so B's auth overrides do not replace tenant A's client."""
    app = _make_topics_app(persona_mock)
    patches = _install_store(topic_store, extra=[getattr(app.state, "_topics_mod", None)])
    client = _client(app, authed=True, ctx=tenant_b_ctx())
    try:
        yield client
    finally:
        close_client(client)
        for p in patches:
            p.stop()
