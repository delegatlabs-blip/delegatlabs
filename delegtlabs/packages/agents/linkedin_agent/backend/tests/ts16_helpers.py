"""TS-16 test helpers from C-subscription-quota + C-billing-catalog + TS-16 ACs."""
from __future__ import annotations

import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.auth_context import AuthContext, get_auth_context
from app.api.deps import require_auth
from tests.ts10_helpers import POSTS_MANUAL, _ensure_posts_import_stubs, post_manual
from tests.ts8_helpers import TENANT_ID, close_client, tenant_ctx
from tests.ts16_store import TENANT_B, QuotaStore

BACKEND_ROOT = Path(__file__).resolve().parents[1]
AGENT_ROOT = BACKEND_ROOT.parent
FRONTEND_ROOT = AGENT_ROOT / "frontend"
USER_SRC = FRONTEND_ROOT / "user" / "src"
ADMIN_SRC = FRONTEND_ROOT / "admin" / "src"
SHARED = FRONTEND_ROOT / "shared"
_EP = BACKEND_ROOT / "app" / "api" / "endpoints"
_JOBS = BACKEND_ROOT / "app" / "jobs"
_SVC = BACKEND_ROOT / "app" / "services"

POSTS_PY = _EP / "posts.py"
ONBOARDING_ADAPTIVE_PY = _EP / "onboarding_adaptive.py"
ONBOARDING_PY = _EP / "onboarding.py"
TENANT_PY = _EP / "tenant.py"
SETTINGS_PY = _EP / "settings.py"
GENERATE_JOB_PY = _JOBS / "generate_job.py"
SCHEDULER_PY = _JOBS / "scheduler.py"
PUBLISH_JOB_PY = _JOBS / "publish_job.py"
BILLING_PY = _SVC / "billing.py"
GENERATION_PY = _SVC / "generation.py"
GROK_PY = _SVC / "grok.py"
USERS_PY = _SVC / "users.py"
CONFIG_PY = BACKEND_ROOT / "app" / "core" / "config.py"
ENV_EXAMPLE = BACKEND_ROOT / ".env.example"
COMPOSE_ROOT = BACKEND_ROOT.parents[3] / "docker-compose.yml"
COMPOSE_PKG = AGENT_ROOT / "docker-compose.yml"
TOPICS_TSX = USER_SRC / "pages" / "Topics.tsx"
SUBSCRIPTION_TAB = USER_SRC / "pages" / "agents" / "post-gen" / "SubscriptionTab.tsx"
CREDITS_TAB = USER_SRC / "pages" / "agents" / "post-gen" / "CreditsTab.tsx"
SUMMARY_CARD = FRONTEND_ROOT / "shared" / "components" / "onboarding" / "SummaryCard.tsx"
API_INDEX = SHARED / "api" / "index.ts"
BILLING_TSX = ADMIN_SRC / "pages" / "Billing.tsx"

MANUAL_POST_COST = 50
PUBLISHED_LINKEDIN = {
    "ok": True,
    "source_status": "published",
    "results": [{"status": "published", "linkedin_post_urn": "urn:li:share:1"}],
}
POSTS_GENERATE = "/posts/generate"
GET_POSTS = "/posts"
CREDITS_PATH = "/tenant/credits"
ROLE_DETAIL = "Requires tenant role: admin, editor, owner"
TITLE_DESC_DETAIL = "title and description are required"
CATALOG_LOAD_ERR = "Could not load plans."
GROK_DEFAULT = "grok-2-image"
LINKEDIN_DAILY_POST_LIMIT = 3
PAYLOAD_KEYS = ("tenant_id", "agent_kind", "slot_kind", "plan_code", "tick_at")
COPY_GENERATE = "Generate My First Posts"
TARGET_PPW = "Target Posts Per Week"
MONDAY_UTC = datetime(2026, 9, 7, 0, 0, tzinfo=timezone.utc)
SUNDAY_UTC = datetime(2026, 9, 6, 23, 59, 59, tzinfo=timezone.utc)
HOUR = datetime(2026, 9, 7, 14, 0, tzinfo=timezone.utc)

_DB_MODULES = (
    "app.core.database",
    "app.jobs.generate_job",
    "app.services.billing",
    "app.services.payments",
    "app.services.quota",
    "app.services.generation",
    "app.api.endpoints.posts",
    "app.api.endpoints.onboarding",
    "app.api.endpoints.onboarding_adaptive",
    "app.services.users",
)


def read_text(path: Path) -> str:
    return path.read_text() if path.is_file() else ""


def glob_text(root: Path, pattern: str) -> str:
    if not root.is_dir():
        return ""
    return "\n".join(p.read_text() for p in root.rglob(pattern) if p.is_file())


def require_file(path: Path, msg: str) -> None:
    if not path.is_file():
        pytest.fail(msg)


def insufficient_credits_detail(action_key: str, amount: int, balance: int) -> str:
    return f"Insufficient credits — {action_key} costs {amount}, balance is {balance}"


def editor_ctx(tenant_id: str = TENANT_ID) -> AuthContext:
    return AuthContext(
        user_id="user-editor",
        staff_role=None,
        tenant_role="editor",
        tenant_id=tenant_id,
        session_id="sid-editor",
        is_user_session=True,
    )


def viewer_ctx(tenant_id: str = TENANT_ID) -> AuthContext:
    return AuthContext(
        user_id="user-viewer",
        staff_role=None,
        tenant_role="viewer",
        tenant_id=tenant_id,
        session_id="sid-viewer",
        is_user_session=True,
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


def _install_store(store: QuotaStore, extra: Optional[list] = None) -> list:
    async def raw(sql: str, params: Optional[dict] = None):
        return store.exec(sql, params)

    async def one(sql: str, params: Optional[dict] = None):
        rows = store.exec(sql, params)
        return rows[0] if rows else None

    async def raw_on_session(*args, **kwargs):
        shifted = args and not isinstance(args[0], str)
        sql = (args[1] if shifted else args[0]) if args else kwargs.get("sql", "")
        params = (
            args[2] if shifted and len(args) > 2
            else args[1] if not shifted and len(args) > 1
            else kwargs.get("params")
        )
        return store.exec(sql, params)

    pairs = (
        ("execute_raw", raw),
        ("execute_one_raw", one),
        ("execute_raw_on_session", raw_on_session),
    )
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


def install_quota_store(store: QuotaStore, extra: Optional[list] = None) -> list:
    return _install_store(store, extra)


def import_generate_job():
    require_file(GENERATE_JOB_PY, "app/jobs/generate_job.py missing (C-subscription-quota §2.1)")
    _ensure_posts_import_stubs()
    sys.modules.pop("app.jobs.generate_job", None)
    import app.jobs.generate_job as gj
    return gj


@pytest.fixture
def quota_store():
    return QuotaStore()


@pytest.fixture
def consume_spy():
    return AsyncMock(name="consume_for_action")


@pytest.fixture
def publish_spy():
    return AsyncMock(return_value=dict(PUBLISHED_LINKEDIN))


@pytest.fixture
def pipeline_spy():
    return AsyncMock(
        return_value={"id": 1, "status": "draft", "generated_text": "hello", "image_url": None}
    )


def _make_posts_app() -> FastAPI:
    _ensure_posts_import_stubs()
    sys.modules.pop("app.api.endpoints.posts", None)
    from app.api.endpoints import posts as posts_mod

    app = FastAPI()
    app.include_router(posts_mod.router)
    app.state._posts_mod = posts_mod
    return app


def _bind_manual_patches(app: FastAPI, consume_spy: AsyncMock, publish_spy: AsyncMock) -> list:
    posts_mod = getattr(app.state, "_posts_mod", None)
    patches = []
    if posts_mod is not None:
        if hasattr(posts_mod, "publish_post"):
            patches.append(patch.object(posts_mod, "publish_post", publish_spy))
        if hasattr(posts_mod, "consume_for_action"):
            patches.append(patch.object(posts_mod, "consume_for_action", consume_spy))
    billing = sys.modules.get("app.services.billing")
    if billing is not None and hasattr(billing, "consume_for_action"):
        patches.append(patch.object(billing, "consume_for_action", consume_spy))
    return patches


def _client(app: FastAPI, *, ctx: Optional[AuthContext], consume_spy, publish_spy, store: QuotaStore) -> TestClient:
    from app.core.config import settings

    app.dependency_overrides.clear()
    if ctx is not None:
        async def _uid() -> str:
            return ctx.user_id

        async def _auth():
            return ctx

        app.dependency_overrides[require_auth] = _uid
        app.dependency_overrides[get_auth_context] = _auth

    patches = [patch.object(settings, "DEV_AUTH_BYPASS", False)]
    patches.extend(_bind_manual_patches(app, consume_spy, publish_spy))
    store_patches = _install_store(store, extra=[getattr(app.state, "_posts_mod", None)])
    for p in patches:
        p.start()
    client = TestClient(app)
    client._ts8_patches = patches + store_patches
    client._consume_spy = consume_spy
    client._publish_spy = publish_spy
    client._quota_store = store
    return client


@pytest.fixture
def ts16_posts_app():
    return _make_posts_app()


@pytest.fixture
def ts16_manual_client(ts16_posts_app, consume_spy, publish_spy, quota_store):
    quota_store.credits[TENANT_ID] = 100
    c = _client(
        ts16_posts_app,
        ctx=tenant_ctx(),
        consume_spy=consume_spy,
        publish_spy=publish_spy,
        store=quota_store,
    )
    yield c
    close_client(c)


@pytest.fixture
def ts16_editor_client(ts16_posts_app, consume_spy, publish_spy, quota_store):
    quota_store.credits[TENANT_ID] = 100
    c = _client(
        ts16_posts_app,
        ctx=editor_ctx(),
        consume_spy=consume_spy,
        publish_spy=publish_spy,
        store=quota_store,
    )
    yield c
    close_client(c)


@pytest.fixture
def ts16_viewer_client(ts16_posts_app, consume_spy, publish_spy, quota_store):
    quota_store.credits[TENANT_ID] = 100
    c = _client(
        ts16_posts_app,
        ctx=viewer_ctx(),
        consume_spy=consume_spy,
        publish_spy=publish_spy,
        store=quota_store,
    )
    yield c
    close_client(c)


@pytest.fixture
def ts16_anon_client(ts16_posts_app, consume_spy, publish_spy, quota_store):
    c = _client(
        ts16_posts_app,
        ctx=None,
        consume_spy=consume_spy,
        publish_spy=publish_spy,
        store=quota_store,
    )
    yield c
    close_client(c)


@pytest.fixture
def ts16_tenant_b_client(consume_spy, publish_spy, quota_store):
    app = _make_posts_app()
    quota_store.credits[TENANT_B] = 100
    c = _client(
        app,
        ctx=tenant_b_ctx(),
        consume_spy=consume_spy,
        publish_spy=publish_spy,
        store=quota_store,
    )
    yield c
    close_client(c)


def consume_called_with_manual(spy: AsyncMock, tenant_id: str = TENANT_ID) -> None:
    assert spy.await_count >= 1 or spy.call_count >= 1
    args, kwargs = spy.call_args
    blob = list(args) + [kwargs.get("tenant_id"), kwargs.get("action_key")]
    assert tenant_id in blob or (args and args[0] == tenant_id)
    assert "manual_post" in blob or (len(args) > 1 and args[1] == "manual_post")


class OrderedSpies:
    def __init__(self) -> None:
        self.order: list[str] = []
        self.publish = AsyncMock(side_effect=self._publish)
        self.consume = AsyncMock(side_effect=self._consume)
        self.publish_error: Optional[BaseException] = None

    async def _publish(self, *args, **kwargs):
        self.order.append("publish")
        if self.publish_error:
            raise self.publish_error
        return dict(PUBLISHED_LINKEDIN)

    async def _consume(self, *args, **kwargs):
        self.order.append("consume")
        return None


def attach_log_capture(logger_name: str = "app.jobs.generate_job"):
    records: list[logging.LogRecord] = []

    class _H(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            records.append(record)

    log = logging.getLogger(logger_name)
    handler = _H()
    log.addHandler(handler)
    log.setLevel(logging.DEBUG)
    return log, handler, records
