"""TS-18 USER CTA/copy + Topic Weights equal-weight visual (static, no Jest).

Q-1 B: cron-only first posts — do not require POST /posts/generate from the CTA.
Q-2 A: equal numeric weights must not size fill/track off unconstrained card min-content.
"""
from __future__ import annotations

import re
from pathlib import Path

from tests.ts15_helpers import (
    API_INDEX,
    COPY_GENERATE,
    COPY_HELPER,
    FILE_MAX,
    FLASHCARD,
    FRONTEND_ROOT,
    INDEX_TS_MAX,
    SHARED,
    SUMMARY_CARD,
    TOPICS_TSX,
    TOPIC_ROW_TSX,
    USER_SRC,
    glob_text,
    read_text,
    topics_ui_blob,
    ts_function_source,
    wc_l,
)

TOAST_FIRST = "Could not generate a first post"
TOAST_ACTIVATE = "Activate one topic under Topic Weights, then try again."
READY_BADGE = "Ready to Generate"
FILL_WIDTH = "${weight * 100}%"
FILL_WIDTH_COMPACT = "${weight*100}%"
_ENABLE_ON_ACTIVE = (
    "disabled={!hasActiveTopic}",
    "disabled={ !hasActiveTopic }",
    "disabled={!hasActive}",
)
_CTA_PATHS = (SUMMARY_CARD, TOPICS_TSX, FLASHCARD, TOPIC_ROW_TSX)
_SRC_ROOTS = (USER_SRC, SHARED, FRONTEND_ROOT / "admin" / "src")
_UI_FILE_MAX = (TOPICS_TSX, TOPIC_ROW_TSX, SUMMARY_CARD, FLASHCARD)


def _frontend_src_blob() -> str:
    chunks = []
    for root in _SRC_ROOTS:
        for pattern in ("*.tsx", "*.ts", "*.css"):
            chunks.append(glob_text(root, pattern))
    return "\n".join(chunks)


def _cta_blob() -> str:
    return "\n".join(read_text(p) for p in _CTA_PATHS)


def _has_pct_fill(src: str) -> bool:
    return FILL_WIDTH in src or FILL_WIDTH_COMPACT in src


def _classname_containing(src: str, token: str) -> str:
    for m in re.finditer(r'className="([^"]*)"', src):
        if token in m.group(1):
            return m.group(1)
    return ""


def _topic_row_card_root_class(src: str) -> str:
    fn = ts_function_source(src, "TopicRow") or src
    ret = re.search(r"return\s*\(", fn)
    body = fn[ret.start() :] if ret else fn
    m = re.search(r'className="([^"]*)"', body)
    return m.group(1) if m else ""


def test_ac_18_03_screenshot_toast_absent_from_frontend():
    """AC-18-03: screenshot toast copy is not in USER frontend source (Q-1 B)."""
    blob = _frontend_src_blob()
    assert TOAST_FIRST not in blob
    assert TOAST_ACTIVATE not in blob


def test_ac_18_02_badge_is_not_ready_to_generate():
    """AC-18-02: Topics/Persona badge is not Ready to Generate; SummaryCard uses Persona ready."""
    summary = read_text(SUMMARY_CARD)
    assert summary, "SummaryCard.tsx missing"
    assert READY_BADGE not in summary
    assert READY_BADGE not in _cta_blob()
    assert "Persona ready" in summary


def test_ac_18_04_generate_first_posts_removed_or_always_disabled():
    """AC-18-04 / F-TEST-01/02: Generate My First Posts removed or always disabled (Q-1 B)."""
    blob = _cta_blob()
    for needle in _ENABLE_ON_ACTIVE:
        assert needle not in blob
    if COPY_GENERATE not in blob:
        return
    summary = read_text(SUMMARY_CARD)
    topics = read_text(TOPICS_TSX)
    btn = ts_function_source(summary, "GenerateFirstPostsButton")
    combined = summary + "\n" + topics
    assert "disabled" in (btn or combined)
    enable_on_active = (
        "disabled={!hasActiveTopic}" in combined
        or ("hasActiveTopic &&" in combined and "onSubmit" in combined)
    )
    assert not enable_on_active, "Generate My First Posts must not enable when a topic is Active"


def test_ac_18_04_cta_surfaces_do_not_call_posts_generate():
    """AC-18-04: GenerateFirstPostsButton / SummaryCard / Topics / FlashcardFlow do not generate."""
    summary = read_text(SUMMARY_CARD)
    topics = read_text(TOPICS_TSX)
    flash = read_text(FLASHCARD)
    btn = ts_function_source(summary, "GenerateFirstPostsButton")
    finish = ts_function_source(flash, "handleFinish")
    for src in (btn, summary, topics, flash, finish):
        assert "postsApi.generate" not in src
        assert "/posts/generate" not in src


def test_ac_18_04_copy_helper_absent_from_cta_surfaces():
    """AC-18-04: helper must not tell the user to activate a topic then click generate."""
    blob = _cta_blob()
    assert COPY_HELPER not in blob
    assert TOAST_ACTIVATE not in blob
    assert READY_BADGE not in blob


def test_ac_18_04_keeps_existing_always_disabled_tests():
    """AC-18-04: test_ac_ed_09, test_ac_hp_07, and test_ac_hp_16 remain (do not delete)."""
    tests = Path(__file__).resolve().parent
    ts15 = read_text(tests / "test_ts15_frontend_static.py")
    ts16 = read_text(tests / "test_ts16_frontend_static.py")
    ts16_static = read_text(tests / "test_ts16_static.py")
    assert "def test_ac_hp_07_generate_first_posts_removed_or_always_disabled" in ts15
    assert "def test_ac_ed_09_generate_first_posts_removed_or_always_disabled" in ts16
    assert "def test_ac_hp_16_onboarding_complete_does_not_generate" in ts16_static


def test_ac_18_08_topic_grid_three_cols_and_min_w_0():
    """AC-18-08 / F-UI-08 / Q-2 A: xl:grid-cols-3 plus min-w-0 so a long label cannot widen a column."""
    topics = read_text(TOPICS_TSX)
    row = read_text(TOPIC_ROW_TSX)
    assert topics, "Topics.tsx missing"
    assert "xl:grid-cols-3" in topics
    grid_cls = _classname_containing(topics, "xl:grid-cols-3")
    card_cls = _topic_row_card_root_class(row)
    assert "min-w-0" in grid_cls or "min-w-0" in card_cls, (
        "Topic Weights grid class and/or TopicRow card root must include min-w-0"
    )


def test_ac_18_08_slider_still_0_05_to_1():
    """AC-18-08 / F-SL-06: weight slider still min={0.05} max={1} (test_ac_ed_07 must still pass)."""
    blob = topics_ui_blob()
    assert "min={0.05}" in blob
    assert "max={1}" in blob


def test_ac_18_08_fill_gone_or_constrained_with_slider():
    """AC-18-08: duplicate % fill is gone, or shares a min-w-0 / w-full parent with Slider."""
    row = read_text(TOPIC_ROW_TSX)
    assert row, "TopicRow.tsx missing"
    if not _has_pct_fill(row):
        return
    slider_i = row.find("<Slider")
    if slider_i < 0:
        slider_i = row.find("Slider")
    fill_i = row.find(FILL_WIDTH)
    if fill_i < 0:
        fill_i = row.find(FILL_WIDTH_COMPACT)
    assert slider_i >= 0, "fill bar remains but Slider is missing"
    lo, hi = min(slider_i, fill_i), max(slider_i, fill_i)
    window = row[max(0, lo - 480) : hi + 60]
    assert "min-w-0" in window, (
        "fill width `${weight * 100}%` must sit in a min-w-0 parent with the Slider, "
        "or the duplicate fill bar must be removed"
    )
    assert "w-full" in window


def test_ac_18_filesize_index_and_touched_ui():
    """FILE_MAX / INDEX_TS_MAX: TS-18 UI files stay ≤500; shared api/index.ts does not grow."""
    assert API_INDEX.is_file(), "frontend/shared/api/index.ts missing"
    n = wc_l(API_INDEX)
    assert n <= INDEX_TS_MAX, f"index.ts has {n} lines (must not grow past {INDEX_TS_MAX})"
    for path in _UI_FILE_MAX:
        if path.is_file():
            lines = wc_l(path)
            assert lines <= FILE_MAX, f"{path} has {lines} lines (FILE_MAX {FILE_MAX})"
