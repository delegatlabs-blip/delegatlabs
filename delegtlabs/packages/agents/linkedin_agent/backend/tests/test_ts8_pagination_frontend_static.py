"""TS-8 Post Gen Posts pagination — source ACs (no Jest/Vitest).

Acceptance from .agent/specs/TS-8.md + user answers:
Posts tab only; shared pager; server limit/offset; URL page+limit;
page numbers + prev/next; page-size select.
"""
from __future__ import annotations

from pathlib import Path

from tests.ts8_helpers import FRONTEND_ROOT

USER_SRC = FRONTEND_ROOT / "user" / "src"
SHARED = FRONTEND_ROOT / "shared"


def _text(path: Path) -> str:
    return path.read_text() if path.is_file() else ""


def test_shared_pagination_bar_exists_with_controls():
    bar = _text(SHARED / "components" / "ui" / "pagination-bar.tsx")
    helpers = _text(SHARED / "lib" / "pagination.ts")
    assert bar, "shared PaginationBar missing"
    assert "PaginationBar" in bar
    assert "Previous" in bar
    assert "Next" in bar
    assert "Select" in bar
    assert "pageSizeOptions" in bar
    assert "10" in helpers and "20" in helpers and "50" in helpers
    assert "DEFAULT_PAGE_SIZE = 50" in helpers


def test_posts_tab_server_paging_and_url():
    src = _text(USER_SRC / "pages" / "agents" / "post-gen" / "PostsTab.tsx")
    assert src, "PostsTab.tsx missing"
    assert "useSearchParams" in src
    assert "PaginationBar" in src
    assert "postsApi.list" in src
    assert "offset" in src
    assert "limit" in src
    assert "data?.total" in src
    assert 'searchParams.get("page")' in src or 'searchParams.get("limit")' in src
    assert 'set("page"' in src
    assert 'set("limit"' in src


def test_other_post_gen_tabs_do_not_use_pagination_bar():
    for name in ("SubscriptionTab.tsx", "CreditsTab.tsx", "PostGenerationTab.tsx"):
        src = _text(USER_SRC / "pages" / "agents" / "post-gen" / name)
        assert src, f"{name} missing"
        assert "PaginationBar" not in src
