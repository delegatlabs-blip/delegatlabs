"""TS-11 credits, file-size, and backend static ACs (C-posts-improve §6/9 + AC-CR/FS/HP-06/07)."""
from __future__ import annotations

from pathlib import Path

from tests.ts11_helpers import (
    FRONTEND_ROOT,
    GEMINI_IMPROVE_PY,
    GEMINI_PY,
    HTML_ALLOWLIST_PY,
    MIGRATIONS_DIR,
    POSTS_PY,
    SCHEMAS_POST_PY,
    SHARED,
    USER_SRC,
    read_text,
    wc_l,
)

POST_GEN_TAB = USER_SRC / "pages" / "agents" / "post-gen" / "PostGenerationTab.tsx"
POSTS_IMPROVE_TS = SHARED / "api" / "posts-improve.ts"
API_INDEX = SHARED / "api" / "index.ts"
STRIP_HTML_TS = SHARED / "lib" / "strip-html.ts"

_NEW_TS11_FILES = (
    GEMINI_IMPROVE_PY,
    HTML_ALLOWLIST_PY,
    POSTS_IMPROVE_TS,
    STRIP_HTML_TS,
)


def _first(name: str) -> Path | None:
    hits = list(FRONTEND_ROOT.rglob(name)) if FRONTEND_ROOT.is_dir() else []
    return hits[0] if hits else None


def test_ac_hp_06_improve_helper_file_not_topic_generate_post():
    """AC-HP-06: new helper improve_post_text exists; does not define/call generate_post."""
    src = read_text(GEMINI_IMPROVE_PY)
    assert src, "app/services/gemini_improve.py missing (C-posts-improve §6)"
    assert "async def improve_post_text" in src
    assert "get_client" in src
    assert "models_to_try" in src
    assert "def generate_post" not in src
    assert "run_generation_pipeline" not in src
    assert "TOPIC_PROMPTS" not in src
    assert "build_system_prompt" not in src


def test_ac_hp_07_light_polish_prompt_text():
    """AC-HP-07: helper prompt includes locked polish / delimiter text from C-posts-improve §6."""
    src = read_text(GEMINI_IMPROVE_PY)
    assert src
    lower = src.lower()
    assert "light polish" in lower
    assert "linkedin professional voice" in lower
    assert "do not invent facts" in lower
    assert "TITLE:" in src
    assert "DESCRIPTION:" in src
    assert "TAGS:" in src
    assert "build_system_prompt" not in src
    assert "TOPIC_PROMPTS" not in src


def test_ac_ed_07_server_walks_models_to_try_with_sdk_timeout():
    """AC-ED-07 / §8: Improve SDK timeout 120000 ms, attempts=1; no extra HTTP retry wrapper."""
    src = read_text(GEMINI_IMPROVE_PY)
    assert src
    assert "timeout=120000" in src or "timeout = 120000" in src
    assert "attempts=1" in src or "attempts = 1" in src
    assert "asyncio.wait_for" not in src
    posts = read_text(POSTS_PY)
    assert "asyncio.wait_for" not in posts


def test_ac_cr_01_improve_handler_does_not_debit():
    """AC-CR-01 / C-posts-improve §9: Improve handler source has no consume_for_action."""
    from tests.ts8_helpers import py_function_source

    posts = read_text(POSTS_PY)
    helper = read_text(GEMINI_IMPROVE_PY)
    improve = py_function_source(posts, "improve_post_endpoint")
    assert improve, "improve_post_endpoint missing"
    for name in ("consume_for_action", "purchase_pack", "select_plan"):
        assert name not in improve
        assert name not in helper
    assert "from app.services.billing" not in helper
    assert "import app.services.billing" not in helper


def test_ac_cr_03_consume_for_action_only_in_manual_post_endpoint():
    """AC-CR-03 / TS-22: consume allowed in manual_post_endpoint and generate_post_endpoint.

    Improve still must not debit. generate MAY consume text_post/image_post.
    purchase_pack / select_plan stay absent.
    """
    from tests.ts8_helpers import py_function_source

    src = read_text(POSTS_PY)
    assert src
    manual = py_function_source(src, "manual_post_endpoint")
    generate = py_function_source(src, "generate_post_endpoint")
    improve = py_function_source(src, "improve_post_endpoint")
    assert manual, "manual_post_endpoint missing"
    assert "consume_for_action" in manual
    assert "manual_post" in manual
    if "consume_for_action" in generate:
        assert "text_post" in generate
        assert "image_post" in generate
        assert "manual_post" not in generate
    assert "consume_for_action" not in improve
    assert "purchase_pack" not in src
    assert "select_plan" not in src


def test_ac_cr_02_no_new_improve_action_key_in_migrations():
    """AC-CR-02: no Improve/polish billing catalog row / new action_key."""
    sql = ""
    if MIGRATIONS_DIR.is_dir():
        sql = "\n".join(p.read_text() for p in MIGRATIONS_DIR.glob("*.sql"))
    lower = sql.lower()
    assert "action_key" not in lower or (
        ", 'improve'" not in lower
        and ', "improve"' not in lower
        and "improve_post" not in lower
        and "polish_post" not in lower
    )


def test_ac_fs_01_post_generation_tab_at_most_500_lines():
    """AC-FS-01: PostGenerationTab.tsx wc -l ≤ 500."""
    assert POST_GEN_TAB.is_file(), "PostGenerationTab.tsx missing"
    assert wc_l(POST_GEN_TAB) <= 500


def test_ac_fs_02_improve_client_extracted_not_on_posts_api():
    """AC-FS-02: Improve client lives in posts-improve.ts with timeout 120000; not postsApi.improve."""
    assert POSTS_IMPROVE_TS.is_file(), "posts-improve.ts missing"
    src = read_text(POSTS_IMPROVE_TS)
    assert "timeout: 120000" in src or "timeout:120000" in src
    assert "improvePost" in src
    assert "/posts/improve" in src
    index = read_text(API_INDEX)
    assert "postsApi.improve" not in index


def test_ac_fs_03_new_and_touched_files_at_most_500_lines():
    """AC-FS-03: new TS-11 files and posts.py / gemini.py stay ≤ 500 lines."""
    extra = [
        _first("DescriptionEditor.tsx"),
        _first("ImprovePreviewDialog.tsx"),
        SHARED / "api" / "client.ts",
    ]
    paths = list(_NEW_TS11_FILES) + [POSTS_PY, GEMINI_PY] + [p for p in extra if p]
    required = (
        GEMINI_IMPROVE_PY,
        HTML_ALLOWLIST_PY,
        POSTS_IMPROVE_TS,
        STRIP_HTML_TS,
    )
    missing = [p for p in required if not p.is_file()]
    assert not missing, f"missing TS-11 files: {missing}"
    for path in paths:
        if path.is_file():
            n = wc_l(path)
            assert n <= 500, f"{path} has {n} lines"


def test_ac_ps_03_no_new_posts_description_html_column():
    """AC-PS-03: no new posts.description HTML column in recent migrations."""
    recent = ""
    if MIGRATIONS_DIR.is_dir():
        numbered = sorted(MIGRATIONS_DIR.glob("*.sql"))
        recent = "\n".join(p.read_text() for p in numbered[-5:])
    assert "posts.description" not in recent
    assert "ADD COLUMN description" not in recent.lower()


def test_contract_schema_names_improve_post_request_response():
    """C-posts-improve §2–3: ImprovePostRequest / ImprovePostResponse with html + plainText."""
    src = read_text(SCHEMAS_POST_PY)
    assert src
    assert "class ImprovePostRequest" in src
    assert "class ImprovePostResponse" in src
    assert "plainText" in src
    assert "class GeneratePostRequest" in src
    req_block = src.split("class ImprovePostRequest")[-1].split("class ")[0]
    assert "topicId" not in req_block
    assert "sourceUrl" not in req_block
