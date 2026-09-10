"""TS-22 test helpers from .agent/requirements/TS-22.md + .agent/contracts/TS-22.md.

Static tests grep owned paths already used by TS-8/10/11/16. HTTP tests reuse
ts16 QuotaStore + TestClient — no new HTTP client library.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any, Optional
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from tests.ts8_helpers import TENANT_ID, close_client, tenant_ctx
from tests.ts16_helpers import (
    POSTS_GENERATE,
    _client as ts16_client,
    editor_ctx,
    viewer_ctx,
)

BACKEND_ROOT = Path(__file__).resolve().parents[1]
AGENT_ROOT = BACKEND_ROOT.parent
FRONTEND_ROOT = AGENT_ROOT / "frontend"
USER_SRC = FRONTEND_ROOT / "user" / "src"
SHARED = FRONTEND_ROOT / "shared"
API_INDEX = SHARED / "api" / "index.ts"
POST_GEN_DIR = USER_SRC / "pages" / "agents" / "post-gen"
POSTS_TAB = POST_GEN_DIR / "PostsTab.tsx"
GENERATE_DIALOG = POST_GEN_DIR / "GeneratePostDialog.tsx"
POST_GEN_TAB = POST_GEN_DIR / "PostGenerationTab.tsx"
TOPICS_TSX = USER_SRC / "pages" / "Topics.tsx"
MIGRATIONS_DIR = BACKEND_ROOT / "app" / "db" / "migrations"
ROLLBACKS_DIR = BACKEND_ROOT / "app" / "db" / "rollbacks"

TEXT_POST_COST = 10
IMAGE_POST_COST = 30
MANUAL_POST_COST = 50
TOPIC_WEIGHTS = "Topic Weights"
NO_DESTINATIONS_DETAIL = (
    "No enabled LinkedIn destinations. Enable at least one destination on Connections."
)
PUBLISH_PY = BACKEND_ROOT / "app" / "services" / "publish.py"

DRAFT_POST = {
    "id": 1,
    "topic_id": None,
    "source_url": None,
    "prompt_text": None,
    "generated_text": "hello",
    "image_prompt": None,
    "image_url": None,
    "status": "draft",
    "destination_id": None,
    "source_post_id": None,
    "linkedin_post_urn": None,
}


def read_text(path: Path) -> str:
    return path.read_text() if path.is_file() else ""


def wizard_blob() -> str:
    return read_text(POSTS_TAB) + "\n" + read_text(GENERATE_DIALOG)


def wizard_dialog_src() -> str:
    """Wizard chrome only — PostsTab also has list edit/delete (not this wizard)."""
    dialog = read_text(GENERATE_DIALOG)
    if dialog:
        return dialog
    tab = read_text(POSTS_TAB)
    from tests.ts15_helpers import ts_function_source

    return ts_function_source(tab, "GeneratePostDialog") or ""


def endpoint_source(src: str, name: str, prelude: int = 800) -> str:
    from tests.ts8_helpers import py_function_source

    fn = py_function_source(src, name)
    m = re.search(rf"^(async )?def {re.escape(name)}\(", src, re.M)
    if not m:
        return fn
    return src[max(0, m.start() - prelude) : m.start()] + fn


def migrations_018_plus() -> list[Path]:
    if not MIGRATIONS_DIR.is_dir():
        return []
    found: list[Path] = []
    for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
        m = re.match(r"^(\d+)_", path.name)
        if m and int(m.group(1)) >= 18:
            found.append(path)
    return found


def rollbacks_018_plus() -> list[Path]:
    if not ROLLBACKS_DIR.is_dir():
        return []
    found: list[Path] = []
    for path in sorted(ROLLBACKS_DIR.glob("*_rollback.sql")):
        m = re.match(r"^(\d+)_", path.name)
        if m and int(m.group(1)) >= 18:
            found.append(path)
    return found


def api_method_block(src: str, name: str) -> str:
    m = re.search(rf"\b{re.escape(name)}\s*:", src)
    if not m:
        return ""
    rest = src[m.start() :]
    nxt = re.search(r"\n\s{2,}[A-Za-z_]\w*\s*:", rest[1:])
    return rest[: nxt.start() + 1] if nxt else rest[:800]


def seed_ts22_costs(store) -> None:
    store.action_costs = [
        {"action_key": "manual_post", "credits": MANUAL_POST_COST, "is_active": True},
        {"action_key": "text_post", "credits": TEXT_POST_COST, "is_active": True},
        {"action_key": "image_post", "credits": IMAGE_POST_COST, "is_active": True},
    ]


def consume_action_blob(spy: AsyncMock) -> list:
    assert spy.await_count >= 1 or spy.call_count >= 1
    args, kwargs = spy.call_args
    return list(args) + list(kwargs.values())


def consume_called_with(spy: AsyncMock, tenant_id: str, action_key: str) -> None:
    blob = consume_action_blob(spy)
    assert tenant_id in blob or (spy.call_args.args and spy.call_args.args[0] == tenant_id)
    assert action_key in blob or (
        len(spy.call_args.args) > 1 and spy.call_args.args[1] == action_key
    )


def pipeline_kwarg(spy: AsyncMock, key: str) -> Any:
    assert spy.await_count >= 1 or spy.call_count >= 1
    return spy.call_args.kwargs.get(key)


def _bind_pipeline(app: FastAPI, pipeline_spy: AsyncMock) -> list:
    patches = []
    posts_mod = getattr(app.state, "_posts_mod", None)
    if posts_mod is not None and hasattr(posts_mod, "run_generation_pipeline"):
        patches.append(patch.object(posts_mod, "run_generation_pipeline", pipeline_spy))
    gen = sys.modules.get("app.services.generation")
    if gen is not None and hasattr(gen, "run_generation_pipeline"):
        patches.append(patch.object(gen, "run_generation_pipeline", pipeline_spy))
    return patches


def ts22_client(
    app: FastAPI,
    *,
    ctx,
    consume_spy: AsyncMock,
    publish_spy: AsyncMock,
    pipeline_spy: AsyncMock,
    store,
) -> TestClient:
    extra = _bind_pipeline(app, pipeline_spy)
    for p in extra:
        p.start()
    client = ts16_client(
        app,
        ctx=ctx,
        consume_spy=consume_spy,
        publish_spy=publish_spy,
        store=store,
    )
    client._ts8_patches = list(getattr(client, "_ts8_patches", [])) + extra
    client._pipeline_spy = pipeline_spy
    return client


def post_generate(client: TestClient, body: Optional[dict] = None):
    return client.post(POSTS_GENERATE, json=body if body is not None else {})


class GenerateOrderedSpies:
    def __init__(self) -> None:
        self.order: list[str] = []
        self.pipeline = AsyncMock(side_effect=self._pipeline)
        self.consume = AsyncMock(side_effect=self._consume)
        self.pipeline_error: Optional[BaseException] = None

    async def _pipeline(self, *args, **kwargs):
        self.order.append("pipeline")
        if self.pipeline_error:
            raise self.pipeline_error
        return dict(DRAFT_POST)

    async def _consume(self, *args, **kwargs):
        self.order.append("consume")
        return None


@pytest.fixture
def ts22_pipeline_spy():
    return AsyncMock(return_value=dict(DRAFT_POST))


@pytest.fixture
def ts22_generate_client(
    ts16_posts_app, consume_spy, publish_spy, ts22_pipeline_spy, quota_store
):
    seed_ts22_costs(quota_store)
    quota_store.credits[TENANT_ID] = 100
    c = ts22_client(
        ts16_posts_app,
        ctx=tenant_ctx(),
        consume_spy=consume_spy,
        publish_spy=publish_spy,
        pipeline_spy=ts22_pipeline_spy,
        store=quota_store,
    )
    yield c
    close_client(c)


@pytest.fixture
def ts22_editor_client(
    ts16_posts_app, consume_spy, publish_spy, ts22_pipeline_spy, quota_store
):
    seed_ts22_costs(quota_store)
    quota_store.credits[TENANT_ID] = 100
    c = ts22_client(
        ts16_posts_app,
        ctx=editor_ctx(),
        consume_spy=consume_spy,
        publish_spy=publish_spy,
        pipeline_spy=ts22_pipeline_spy,
        store=quota_store,
    )
    yield c
    close_client(c)


@pytest.fixture
def ts22_viewer_client(
    ts16_posts_app, consume_spy, publish_spy, ts22_pipeline_spy, quota_store
):
    seed_ts22_costs(quota_store)
    quota_store.credits[TENANT_ID] = 100
    c = ts22_client(
        ts16_posts_app,
        ctx=viewer_ctx(),
        consume_spy=consume_spy,
        publish_spy=publish_spy,
        pipeline_spy=ts22_pipeline_spy,
        store=quota_store,
    )
    yield c
    close_client(c)
