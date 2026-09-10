"""TS-10 test helpers. Built from TS-10 requirements + C-posts-manual + Wave 3 locks.

Does not import posts handler logic at module import. HTTP tests talk to
POST /posts/manual only. Auth override mirrors TS-8 (require_auth + get_auth_context).
"""
from __future__ import annotations

import sys
import types
from pathlib import Path
from typing import Optional
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.auth_context import get_auth_context
from app.api.deps import require_auth
from tests.ts8_helpers import close_client, tenant_ctx


def _install_stub(name: str, **attrs) -> None:
    existing = sys.modules.get(name)
    if existing is not None and all(hasattr(existing, key) for key in attrs):
        return
    mod = types.ModuleType(name)
    for key, value in attrs.items():
        setattr(mod, key, value)
    sys.modules[name] = mod
    parent, _, child = name.rpartition(".")
    if parent and parent in sys.modules:
        setattr(sys.modules[parent], child, mod)


def _ensure_posts_import_stubs() -> None:
    """Host pytest has no openai (TS-8 same gap). Stub posts.py import-time deps."""
    if "openai" not in sys.modules:
        openai = types.ModuleType("openai")

        class AsyncOpenAI:
            def __init__(self, *args, **kwargs):
                pass

        openai.AsyncOpenAI = AsyncOpenAI  # type: ignore[attr-defined]
        sys.modules["openai"] = openai

    _install_stub(
        "app.services.generation",
        run_generation_pipeline=AsyncMock(return_value={}),
    )
    _install_stub(
        "app.services.grok",
        generate_and_store_image=AsyncMock(return_value=None),
    )
    # A prior failed import leaves a broken posts module in sys.modules.
    sys.modules.pop("app.api.endpoints.posts", None)

BACKEND_ROOT = Path(__file__).resolve().parents[1]
AGENT_ROOT = BACKEND_ROOT.parent
FRONTEND_ROOT = AGENT_ROOT / "frontend"
USER_NGINX = FRONTEND_ROOT / "user" / "nginx.conf"
ADMIN_NGINX = FRONTEND_ROOT / "admin" / "nginx.conf"

# Workspace roots for contract / docs (parents[7] = tarun_Sir from this file)
_WORKSPACE = Path(__file__).resolve().parents[7]
CANONICAL_CONTRACT = _WORKSPACE / "delegtlabs" / ".agent" / "contracts" / "C-posts-manual.md"
LOCKED_CONTRACT = _WORKSPACE / ".agent" / "contracts" / "C-posts-manual.md"

POSTS_MANUAL = "/posts/manual"
TYPE_DETAIL = "Image must be JPEG or PNG"
UNAUTH_DETAIL = "Unauthorized — no valid session"

# C-posts-manual + Wave 3 locks (exact)
ALLOWED_TYPES = ("image/jpeg", "image/png")
DISALLOWED_TYPE_CASES = (
    ("anim.gif", b"GIF89a-not-a-real-gif", "image/gif"),
    ("pic.webp", b"RIFF-not-a-real-webp", "image/webp"),
    ("pic.jpg", b"not-jpeg-bytes", "image/jpg"),
    ("no-type.bin", b"bytes-without-type", ""),
)


def active_nginx_lines(text: str) -> list[str]:
    """Directive lines with `#` comments stripped (AC-NGX-01 must not be comment-only)."""
    out: list[str] = []
    for raw in text.splitlines():
        stripped = raw.split("#", 1)[0].strip()
        if stripped:
            out.append(stripped)
    return out


def post_manual(
    client: TestClient,
    *,
    title: str = "Hello",
    description: str = "World",
    tags: Optional[str] = None,
    image: Optional[tuple[str, bytes, str]] = None,
):
    data = {"title": title, "description": description}
    if tags is not None:
        data["tags"] = tags
    files = None
    if image is not None:
        filename, content, content_type = image
        files = {"image": (filename, content, content_type)}
    return client.post(POSTS_MANUAL, data=data, files=files)


def _make_posts_app() -> FastAPI:
    # Import posts router only (same isolation idea as TS-8 tenant+admin app).
    _ensure_posts_import_stubs()
    from app.api.endpoints import posts as posts_mod

    app = FastAPI()
    app.include_router(posts_mod.router)
    app.state._posts_mod = posts_mod  # type: ignore[attr-defined]
    return app


def _publish_patches(app: FastAPI) -> list:
    """Mock LinkedIn publish if the posts module binds publish_post (out of scope)."""
    patches = []
    posts_mod = getattr(app.state, "_posts_mod", None)
    if posts_mod is not None and hasattr(posts_mod, "publish_post"):
        patches.append(
            patch.object(posts_mod, "publish_post", new=AsyncMock(return_value={"ok": True}))
        )
    return patches


def _client(app: FastAPI, *, authed: bool) -> TestClient:
    from app.core.config import settings

    app.dependency_overrides.clear()
    if authed:
        ctx = tenant_ctx()

        async def _uid() -> str:
            return ctx.user_id

        async def _ctx():
            return ctx

        app.dependency_overrides[require_auth] = _uid
        app.dependency_overrides[get_auth_context] = _ctx

    patches = [patch.object(settings, "DEV_AUTH_BYPASS", False)]
    patches.extend(_publish_patches(app))
    for p in patches:
        p.start()
    client = TestClient(app)
    client._ts8_patches = patches  # type: ignore[attr-defined]
    return client


@pytest.fixture
def posts_app():
    return _make_posts_app()


@pytest.fixture
def posts_client(posts_app):
    c = _client(posts_app, authed=True)
    yield c
    close_client(c)


@pytest.fixture
def posts_anon_client(posts_app):
    c = _client(posts_app, authed=False)
    yield c
    close_client(c)
