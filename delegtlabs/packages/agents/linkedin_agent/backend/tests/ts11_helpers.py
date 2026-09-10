"""TS-11 test helpers. Built from C-posts-improve + .agent/requirements/TS-11.md.

Does not import Wave 3 handler bodies. HTTP tests talk to POST /posts/improve only.
Auth override mirrors TS-10 (require_auth + get_auth_context). Gemini is AsyncMock.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Optional
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.auth_context import AuthContext, get_auth_context
from app.api.deps import require_auth
from tests.ts10_helpers import (
    _ensure_posts_import_stubs,
    _install_stub,
    _publish_patches,
)
from tests.ts8_helpers import TENANT_ID, close_client, tenant_ctx

BACKEND_ROOT = Path(__file__).resolve().parents[1]
AGENT_ROOT = BACKEND_ROOT.parent
FRONTEND_ROOT = AGENT_ROOT / "frontend"
USER_SRC = FRONTEND_ROOT / "user" / "src"
SHARED = FRONTEND_ROOT / "shared"
POSTS_PY = BACKEND_ROOT / "app" / "api" / "endpoints" / "posts.py"
GEMINI_PY = BACKEND_ROOT / "app" / "services" / "gemini.py"
GEMINI_IMPROVE_PY = BACKEND_ROOT / "app" / "services" / "gemini_improve.py"
HTML_ALLOWLIST_PY = BACKEND_ROOT / "app" / "services" / "html_allowlist.py"
SCHEMAS_POST_PY = BACKEND_ROOT / "app" / "schemas" / "post.py"
MIGRATIONS_DIR = BACKEND_ROOT / "app" / "db" / "migrations"

POSTS_IMPROVE = "/posts/improve"
POSTS_MANUAL = "/posts/manual"
POSTS_GENERATE = "/posts/generate"
UNAUTH_DETAIL = "Unauthorized — no valid session"
EMPTY_BOTH_DETAIL = "title or description is required"
GEMINI_KEY_DETAIL = "GEMINI_API_KEY is not configured in environment variables"
LINKEDIN_CHAR_LIMIT = 3000
IMPROVE_TIMEOUT_MS = 120000
ROLE_DETAIL = "Requires tenant role: admin, editor, owner"

DEFAULT_HTML = "<p>Polished body</p>"
DEFAULT_PLAIN = "Polished body"
DEFAULT_IMPROVE = {"html": DEFAULT_HTML, "plainText": DEFAULT_PLAIN}

IMPROVE_LABEL = "Improve the text"


def wc_l(path: Path) -> int:
    """Match `wc -l` (counts newline-terminated lines; last partial line counts)."""
    if not path.is_file():
        return 0
    text = path.read_text()
    if not text:
        return 0
    return text.count("\n") + (0 if text.endswith("\n") else 1)


def read_text(path: Path) -> str:
    return path.read_text() if path.is_file() else ""


def first_named(name: str, root: Path) -> Path | None:
    hits = list(root.rglob(name)) if root.is_dir() else []
    return hits[0] if hits else None


def read_named(name: str, root: Path) -> str:
    path = first_named(name, root)
    return read_text(path) if path else ""


def glob_text(root: Path, pattern: str) -> str:
    if not root.is_dir():
        return ""
    return "\n".join(p.read_text() for p in root.rglob(pattern) if p.is_file())


def normalize_tags(raw: Optional[str]) -> list[str]:
    """Contract: same as manual `_normalize_tags` (comma string → list)."""
    if raw is None:
        return []
    return [part.strip() for part in str(raw).split(",") if part.strip()]


def compose_manual_body(title: str, description: str, tags: Optional[str] = None) -> str:
    """C-posts-improve §4 — identical shape to `_compose_manual_body`."""
    tag_list = normalize_tags(tags)
    body = f"{title.strip()}\n\n{description.strip()}"
    if tag_list:
        body = f"{body}\n\n" + " ".join(f"#{t}" for t in tag_list)
    return body


def over_limit_detail(n: int) -> str:
    return f"Composed post exceeds LinkedIn limit ({n} / {LINKEDIN_CHAR_LIMIT})"


def _ensure_improve_import_stubs(improve_mock: AsyncMock) -> None:
    _ensure_posts_import_stubs()
    sys.modules.pop("app.services.gemini_improve", None)
    _install_stub("app.services.gemini_improve", improve_post_text=improve_mock)
    sys.modules.pop("app.api.endpoints.posts", None)


def _make_improve_app(improve_mock: AsyncMock) -> FastAPI:
    _ensure_improve_import_stubs(improve_mock)
    from app.api.endpoints import posts as posts_mod

    app = FastAPI()
    app.include_router(posts_mod.router)
    app.state._posts_mod = posts_mod  # type: ignore[attr-defined]
    app.state.improve_mock = improve_mock  # type: ignore[attr-defined]
    return app


def _bind_improve_patches(app: FastAPI, improve_mock: AsyncMock) -> list:
    posts_mod = getattr(app.state, "_posts_mod", None)
    patches = list(_publish_patches(app))
    gemini_mod = sys.modules.get("app.services.gemini_improve")
    if gemini_mod is not None:
        patches.append(patch.object(gemini_mod, "improve_post_text", improve_mock))
    if posts_mod is not None:
        if hasattr(posts_mod, "improve_post_text"):
            patches.append(patch.object(posts_mod, "improve_post_text", improve_mock))
        if hasattr(posts_mod, "gemini_improve"):
            patches.append(
                patch.object(posts_mod.gemini_improve, "improve_post_text", improve_mock)
            )
        for name in ("generate_post", "run_generation_pipeline"):
            if hasattr(posts_mod, name):
                patches.append(
                    patch.object(
                        posts_mod,
                        name,
                        new=AsyncMock(
                            side_effect=AssertionError(f"{name} must not run on Improve")
                        ),
                    )
                )
    return patches


def _client(
    app: FastAPI,
    *,
    authed: bool,
    ctx: Optional[AuthContext] = None,
) -> TestClient:
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

    improve_mock = getattr(app.state, "improve_mock", AsyncMock(return_value=DEFAULT_IMPROVE))
    patches = [patch.object(settings, "DEV_AUTH_BYPASS", False)]
    patches.extend(_bind_improve_patches(app, improve_mock))
    for p in patches:
        p.start()
    client = TestClient(app)
    client._ts8_patches = patches  # type: ignore[attr-defined]
    client._improve_mock = improve_mock  # type: ignore[attr-defined]
    return client


def viewer_ctx() -> AuthContext:
    return AuthContext(
        user_id="user-viewer",
        staff_role=None,
        tenant_role="viewer",
        tenant_id=TENANT_ID,
        session_id="sid-viewer",
        is_user_session=True,
    )


def post_improve(
    client: TestClient,
    *,
    title: str = "Headline",
    description: str = "Plain body text",
    tags: Any = None,
    json_body: Optional[dict] = None,
    omit_tags: bool = False,
):
    if json_body is not None:
        return client.post(POSTS_IMPROVE, json=json_body)
    body: dict[str, Any] = {"title": title, "description": description}
    if not omit_tags:
        if tags is not None:
            body["tags"] = tags
    return client.post(POSTS_IMPROVE, json=body)


def improve_call_kwargs(mock: AsyncMock) -> dict:
    assert mock.await_count >= 1 or mock.call_count >= 1
    args, kwargs = mock.call_args
    if kwargs:
        return kwargs
    return {}


@pytest.fixture
def improve_mock():
    return AsyncMock(return_value=dict(DEFAULT_IMPROVE))


@pytest.fixture
def improve_app(improve_mock):
    return _make_improve_app(improve_mock)


@pytest.fixture
def improve_client(improve_app, improve_mock):
    c = _client(improve_app, authed=True)
    yield c
    close_client(c)


@pytest.fixture
def improve_anon_client(improve_app):
    c = _client(improve_app, authed=False)
    yield c
    close_client(c)


@pytest.fixture
def improve_viewer_client(improve_app):
    c = _client(improve_app, authed=True, ctx=viewer_ctx())
    yield c
    close_client(c)
