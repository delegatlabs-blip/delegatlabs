"""TS-15 credits, file-size, migration, slug-insert, and helper source ACs."""
from __future__ import annotations

import re

from tests.ts15_helpers import (
    API_INDEX,
    APP_TSX,
    BACKEND_ROOT,
    CONFIG_PY,
    ENV_EXAMPLE,
    FILE_MAX,
    FLASHCARD,
    GEMINI_PERSONA_PY,
    GEMINI_PY,
    GENERATION_PY,
    INDEX_TS_MAX,
    MIGRATION_016,
    MIGRATIONS_DIR,
    ONBOARDING_ADAPTIVE_PY,
    ONBOARDING_PY,
    ROLLBACK_016,
    SCHEMAS_TOPIC_PY,
    SUMMARY_CARD,
    TOPICS_PERSONA_TS,
    TOPICS_PY,
    TOPICS_TSX,
    TOPIC_ROW_TSX,
    py_function_source,
    read_text,
    require_file,
    wc_l,
)

_NEW_TS15 = (GEMINI_PERSONA_PY, TOPICS_PERSONA_TS, TOPIC_ROW_TSX)
_TEST_FILES = (
    BACKEND_ROOT / "tests" / "ts15_helpers.py",
    BACKEND_ROOT / "tests" / "ts15_store.py",
)
_TOUCHED = (
    TOPICS_PY,
    GEMINI_PY,
    GENERATION_PY,
    ONBOARDING_ADAPTIVE_PY,
    ONBOARDING_PY,
    TOPICS_TSX,
    TOPIC_ROW_TSX,
    FLASHCARD,
    APP_TSX,
    SUMMARY_CARD,
    SCHEMAS_TOPIC_PY,
)


def test_ac_cr_01_no_consume_for_action_on_topics_or_persona_helper():
    """AC-CR-01: no consume_for_action on topics.py and gemini_persona_topics.py."""
    topics = read_text(TOPICS_PY)
    assert topics, "topics.py missing"
    assert "consume_for_action" not in topics
    assert "from app.services.billing" not in topics
    assert "import app.services.billing" not in topics
    require_file(GEMINI_PERSONA_PY, "gemini_persona_topics.py missing (C-persona-topics §9)")
    helper = read_text(GEMINI_PERSONA_PY)
    assert "consume_for_action" not in helper
    assert "from app.services.billing" not in helper
    assert "import app.services.billing" not in helper
    for path in (ONBOARDING_ADAPTIVE_PY, ONBOARDING_PY, GEMINI_PY, GENERATION_PY):
        assert "consume_for_action" not in read_text(path)


def test_ac_cr_02_no_new_billable_action_key():
    """AC-CR-02: no new billing catalog row / action_key for topic generation."""
    sql = ""
    if MIGRATIONS_DIR.is_dir():
        sql = "\n".join(p.read_text() for p in MIGRATIONS_DIR.glob("*.sql"))
    lower = sql.lower()
    assert "persona_topic" not in lower
    assert "generate_persona" not in lower
    assert ", 'topic_generate'" not in lower


def test_ac_hp_10_gemini_persona_timeout_attempts_persona_data():
    """AC-HP-10 / §9: timeout=120000, attempts=1, PERSONA DATA delimiters; no billing import."""
    require_file(GEMINI_PERSONA_PY, "gemini_persona_topics.py missing (C-persona-topics §9)")
    src = read_text(GEMINI_PERSONA_PY)
    assert "async def generate_persona_topic_catalog" in src
    assert "timeout=120000" in src or "timeout = 120000" in src
    assert "attempts=1" in src or "attempts = 1" in src
    assert "PERSONA DATA:" in src
    assert "---" in src
    assert "get_client" in src
    assert "gemini-2.0-flash-lite" in src
    assert "gemini-2.0-flash" in src
    assert "gemini-1.5-flash" in src
    assert "asyncio.wait_for" not in src
    assert "consume_for_action" not in src
    assert "from app.services.billing" not in src
    assert "generate_post" not in src
    assert "improve_post_text" not in src
    assert "run_generation_pipeline" not in src
    assert "TOPIC_PROMPTS" not in src
    assert "build_system_prompt" not in src
    assert "expected 10 topics with 5 options each" in src
    assert "PERSONA DATA" in src


def test_rt_15_3_persist_uses_tenant_advisory_lock():
    """RT-15-3: persist_persona_catalog takes pg_advisory_xact_lock(hashtext(tenant_id)) before DELETE/INSERT."""
    persist = py_function_source(read_text(TOPICS_PY), "persist_persona_catalog")
    assert persist, "persist_persona_catalog missing"
    assert "pg_advisory_xact_lock" in persist
    assert "hashtext" in persist


def test_ac_neg_02_no_preferred_topics_insert_on_adaptive_complete():
    """AC-NEG-02 / Q-5 A: adaptive complete path has no preferred_topics INSERT into topics."""
    require_file(ONBOARDING_ADAPTIVE_PY, "onboarding_adaptive.py missing")
    src = read_text(ONBOARDING_ADAPTIVE_PY)
    complete = py_function_source(src, "adaptive_complete")
    assert complete, "adaptive_complete missing"
    assert "generate_persona_topic_catalog" not in py_function_source(src, "adaptive_answer")
    assert not re.search(r"INSERT\s+INTO\s+topics", complete, re.I)
    gen = py_function_source(src, "_generation_topic_id")
    assert not re.search(r"UPDATE\s+topics[\s\S]{0,240}is_active\s*=\s*true", gen, re.I)


def test_ac_neg_03_no_topics_of_interest_insert_on_legacy_complete():
    """AC-NEG-03 / Q-5 A: legacy POST /onboarding complete has no topicsOfInterest INSERT."""
    require_file(ONBOARDING_PY, "onboarding.py missing")
    src = read_text(ONBOARDING_PY)
    fn = py_function_source(src, "save_onboarding")
    assert fn, "save_onboarding missing"
    assert not re.search(r"INSERT\s+INTO\s+topics", fn, re.I)
    if "topicsOfInterest" in fn:
        assert "INSERT" not in fn


def test_ac_neg_08_no_new_env_var_names():
    """AC-NEG-08: 10×5 uses existing GEMINI_API_KEY / GEMINI_MODEL / GEMINI_FALLBACK_MODEL."""
    cfg = read_text(CONFIG_PY)
    env = read_text(ENV_EXAMPLE)
    assert "GEMINI_API_KEY" in cfg
    assert "GEMINI_MODEL" in cfg
    assert "GEMINI_FALLBACK_MODEL" in cfg
    helper = read_text(GEMINI_PERSONA_PY) if GEMINI_PERSONA_PY.is_file() else ""
    blob = cfg + "\n" + env + "\n" + helper
    for name in ("PERSONA_GEMINI", "TOPICS_GEMINI", "GEMINI_PERSONA_TIMEOUT", "GEMINI_TOPICS_MODEL"):
        assert name not in blob


def test_ac_neg_07_out_of_scope_surfaces_unchanged():
    """AC-NEG-07: Improve / Matchifyx / LinkedIn publish not used as TS-15 vehicles."""
    posts = read_text(BACKEND_ROOT / "app" / "api" / "endpoints" / "posts.py")
    improve = read_text(BACKEND_ROOT / "app" / "services" / "gemini_improve.py")
    assert "generate-persona" not in posts
    assert "generate_persona_topic_catalog" not in posts
    assert "generate_persona_topic_catalog" not in improve
    publish = read_text(BACKEND_ROOT / "app" / "services" / "publish.py")
    if publish:
        assert "generate_persona_topic_catalog" not in publish


def test_ac_fs_02_new_and_touched_files_at_most_500_lines():
    """AC-FS-02: every new TS-15 file ≤ 500; edited product files stay ≤ 500 (index.ts uses 655)."""
    missing = [p for p in _NEW_TS15 if not p.is_file()]
    assert not missing, f"missing TS-15 files: {missing}"
    for path in list(_NEW_TS15) + [p for p in _TOUCHED if p.is_file()] + [p for p in _TEST_FILES if p.is_file()]:
        n = wc_l(path)
        assert n <= FILE_MAX, f"{path} has {n} lines"
    if API_INDEX.is_file():
        n = wc_l(API_INDEX)
        assert n <= INDEX_TS_MAX, f"index.ts has {n} lines"


def test_contract_016_migration_exists_tenant_scoped_no_global_seed_delete():
    """Schema: 016 has tenant_id + tenant_topic_replacements; does not DELETE react-new-feature globally."""
    require_file(MIGRATION_016, "016_topics_persona_options.sql missing (C-persona-topics-schema)")
    src = read_text(MIGRATION_016)
    assert "tenant_id" in src
    assert "tenant_topic_replacements" in src
    assert "selected_option" in src
    assert "options" in src
    assert not re.search(r"TRUNCATE\s+topics", src, re.I)
    for m in re.finditer(r"DELETE\s+FROM\s+topics\b[\s\S]{0,500}", src, re.I):
        chunk = m.group(0)
        if "react-new-feature" in chunk.lower():
            assert "tenant_id" in chunk.lower(), "016 globally DELETEs seed slug react-new-feature"
    require_file(ROLLBACK_016, "016_topics_persona_options_rollback.sql missing")


def test_ac_rt_01_last_answer_payload_exposes_adaptive_status_completed():
    """AC-RT-01 HTTP mapping: last-answer payload sets adaptive.status from session.status."""
    src = read_text(ONBOARDING_ADAPTIVE_PY)
    fn = py_function_source(src, "_client_payload")
    blob = fn or src
    assert "session.status" in blob
    assert "completed" in blob
    answer = py_function_source(src, "adaptive_answer")
    assert "generate_persona_topic_catalog" not in answer
    assert "generate-persona" not in answer


def test_contract_schema_topic_update_has_selected_option_value():
    """§7: TopicUpdateRequest includes selected_option_value."""
    src = read_text(SCHEMAS_TOPIC_PY)
    assert src
    assert "selected_option_value" in src
    assert "class TopicUpdateRequest" in src
