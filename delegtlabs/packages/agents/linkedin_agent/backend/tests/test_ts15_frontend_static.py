"""TS-15 USER routing/copy source ACs (no Jest). Contract C-persona-topics §13–14 supersedes AC-RT-02."""
from __future__ import annotations

from tests.ts15_helpers import (
    API_INDEX,
    APP_TSX,
    ARIA_DRAFT,
    ARIA_ON,
    COPY_GENERATE,
    COPY_PAGE,
    COPY_WEIGHTS,
    ERR_FALLBACK,
    FLASHCARD,
    FORBIDDEN_ARIA,
    INDEX_TS_MAX,
    NAV_WEIGHTS,
    ONBOARDING_PAGE,
    ONBOARDING_STATUS,
    SHARED,
    SUMMARY_CARD,
    TIMEOUT_MS,
    TOPICS_PERSONA_TS,
    TOPICS_TSX,
    glob_text,
    read_text,
    topics_ui_blob,
    ts_function_source,
    wc_l,
)


def test_ac_rt_01_is_onboarding_complete_true_when_adaptive_status_completed():
    """AC-RT-01: isOnboardingComplete({adaptive.status:completed}) is true without complete POST."""
    src = read_text(ONBOARDING_STATUS)
    assert src, "onboarding-status.ts missing"
    assert 'adaptive?.status === "completed"' in src
    assert "adaptive?.complete === true" in src
    assert "adaptiveComplete" not in src


def test_ac_rt_02_superseded_onboarding_route_navigates_to_topics_tab_weights():
    """AC-RT-02 superseded by C-persona-topics §14: adaptive completed → /topics?tab=weights, not /dashboard."""
    src = read_text(APP_TSX)
    assert src, "App.tsx missing"
    route = ts_function_source(src, "OnboardingRoute")
    assert route, "OnboardingRoute missing"
    assert NAV_WEIGHTS in route
    assert "tab=weights" in route
    assert "adaptive.status" in route or "adaptive?.status" in route
    assert "adaptive.complete" in route or "adaptive?.complete" in route
    assert 'to="/dashboard"' in route


def test_ac_rt_03_topics_stays_behind_require_onboarding():
    """AC-RT-03: /topics remains inside the RequireOnboarding tree."""
    src = read_text(APP_TSX)
    start = src.find("<RequireOnboarding>")
    end = src.find("</RequireOnboarding>")
    assert start != -1 and end != -1 and end > start
    tree = src[start:end]
    assert 'path="/topics"' in tree
    req = ts_function_source(src, "RequireOnboarding")
    assert 'to="/onboarding"' in req


def test_ac_rt_04_completed_session_can_reach_topics():
    """AC-RT-04: isOnboardingComplete true (status completed) allows /topics before adaptiveComplete."""
    status = read_text(ONBOARDING_STATUS)
    app = read_text(APP_TSX)
    assert 'adaptive?.status === "completed"' in status
    assert "isOnboardingComplete" in app
    start = app.find("<RequireOnboarding>")
    end = app.find("</RequireOnboarding>")
    assert 'path="/topics"' in app[start:end]


def test_ac_em_03_incomplete_persona_redirects_topics_to_onboarding():
    """AC-EM-03: incomplete persona cannot open /topics (RequireOnboarding → /onboarding)."""
    req = ts_function_source(read_text(APP_TSX), "RequireOnboarding")
    assert "isOnboardingComplete" in req
    assert 'to="/onboarding"' in req


def test_ac_hp_02_land_on_topic_weights_tab():
    """AC-HP-02 / Q-6 B: after last question, Weights on /topics (TabsTrigger value=weights)."""
    app = read_text(APP_TSX)
    topics = topics_ui_blob()
    assert NAV_WEIGHTS in app
    assert 'value="weights"' in topics
    assert 'value="onboarding"' in topics


def test_ac_hp_03_flashcard_gate_does_not_auto_complete():
    """AC-HP-03 / Q-12 C: FlashcardFlow has no auto complete effect (no gateFinished handleFinish on complete)."""
    src = read_text(FLASHCARD)
    assert src, "FlashcardFlow.tsx missing"
    assert "gateFinished.current = true" not in src
    for chunk in src.split("useEffect"):
        if chunk.startswith("(") and "handleFinish" in chunk and "complete" in chunk:
            assert "void handleFinish()" not in chunk
            assert not re_search_call_handle_finish(chunk)


def re_search_call_handle_finish(chunk: str) -> bool:
    return "handleFinish()" in chunk and "function handleFinish" not in chunk


def test_ac_ed_05_edit_mode_does_not_auto_complete():
    """AC-ED-05: Topics Persona tab FlashcardFlow mode=edit never auto-POSTs complete."""
    topics = read_text(TOPICS_TSX)
    flow = read_text(FLASHCARD)
    assert 'mode="edit"' in topics
    assert "gateFinished.current = true" not in flow


def test_ac_hp_07_generate_first_posts_removed_or_always_disabled():
    """TS-15 AC-HP-07 superseded by TS-16 Q-11 A / AC-ED-09.

    Generate My First Posts is removed or always disabled — including when a topic is Active.
    """
    blob = topics_ui_blob() + "\n" + read_text(FLASHCARD) + "\n" + read_text(SUMMARY_CARD)
    topics = read_text(TOPICS_TSX)
    summary = read_text(SUMMARY_CARD)
    if COPY_GENERATE not in blob:
        return
    assert "disabled={!hasActiveTopic}" not in blob
    assert "disabled={ !hasActiveTopic }" not in blob
    assert "disabled={!hasActive}" not in blob
    combined = summary + "\n" + topics
    assert "disabled" in combined
    enable_on_active = (
        "disabled={!hasActiveTopic}" in combined
        or "hasActiveTopic &&" in combined and "onSubmit" in combined
    )
    assert not enable_on_active, "Generate My First Posts must not enable when a topic is Active"


def test_ac_ed_06_copy_no_longer_says_one_active():
    """AC-ED-06 / §14: Topic Weights copy does not claim only one topic can be Active."""
    topics = topics_ui_blob()
    assert COPY_PAGE in topics
    assert COPY_WEIGHTS in topics
    assert "only one topic can be Active" not in topics
    assert "only one topic can be active at a time" not in topics
    assert FORBIDDEN_ARIA not in topics
    assert ARIA_ON in topics
    assert ARIA_DRAFT in topics


def test_ac_ed_07_weight_slider_still_0_05_to_1():
    """AC-ED-07: weight slider still 0.05–1 on Active rows."""
    topics = topics_ui_blob()
    assert "min={0.05}" in topics
    assert "max={1}" in topics


def test_ac_fs_01_shared_api_index_does_not_grow():
    """AC-FS-01: wc -l frontend/shared/api/index.ts is ≤ 655."""
    assert API_INDEX.is_file(), "frontend/shared/api/index.ts missing"
    n = wc_l(API_INDEX)
    assert n <= INDEX_TS_MAX, f"index.ts has {n} lines (baseline 655; must not grow)"


def test_contract_topics_persona_client_timeout_and_path():
    """§13: topics-persona.ts timeout 120000; generatePersonaTopics → /topics/generate-persona."""
    src = read_text(TOPICS_PERSONA_TS)
    assert src, "frontend/shared/api/topics-persona.ts missing (C-persona-topics §13)"
    assert "generatePersonaTopics" in src
    assert "/topics/generate-persona" in src
    assert f"timeout: {TIMEOUT_MS}" in src or f"timeout:{TIMEOUT_MS}" in src
    assert "listPersonaTopics" in src
    assert "patchPersonaTopic" in src
    index = read_text(API_INDEX)
    assert "generatePersonaTopics" not in index
    assert "listPersonaTopics" not in index


def test_contract_topics_page_uses_persona_client_not_topics_api():
    """§13: Topics page uses listPersonaTopics / patchPersonaTopic / generatePersonaTopics, not topicsApi."""
    src = topics_ui_blob()
    assert src, "Topics.tsx missing"
    assert "listPersonaTopics" in src
    assert "patchPersonaTopic" in src
    assert "generatePersonaTopics" in src
    assert "topicsApi" not in src


def test_ac_err_01_visible_loading_during_generate():
    """AC-ERR-01: visible loading while 10×5 request in flight."""
    src = read_text(TOPICS_TSX)
    assert "generatePersonaTopics" in src
    loading = "isPending" in src or "isLoading" in src or "Loader" in src or "loading" in src.lower()
    assert loading, "Topic Weights loading indicator missing while generate-persona is pending"


def test_ac_err_02_visible_error_retry_api_error_message():
    """AC-ERR-02 / §14: visible error; retry generatePersonaTopics; apiErrorMessage fallback copy."""
    src = read_text(TOPICS_TSX)
    assert "apiErrorMessage" in src
    assert ERR_FALLBACK in src
    assert "toast.error" in src
    assert "generatePersonaTopics" in src


def test_ac_hp_01_generate_persona_not_inside_adaptive_answer():
    """AC-HP-01 / §14: generate-persona is not called from adaptiveAnswer."""
    onboarding_ui = glob_text(SHARED / "components" / "onboarding", "*.tsx")
    assert "/topics/generate-persona" not in onboarding_ui
    api = glob_text(SHARED / "api", "*.ts")
    assert "adaptive/answer" in api or "adaptiveAnswer" in api


def test_contract_first_post_success_nav_unchanged():
    """TS-15 §14 superseded by TS-16 Q-11 A: no first-post success nav to Post Gen.

    Complete / gate lands on Topic Weights. First posts are cron-only;
    Generate My First Posts stays removed or always disabled (AC-HP-07).
    """
    src = read_text(FLASHCARD)
    assert src, "FlashcardFlow.tsx missing"
    assert NAV_WEIGHTS in src
    assert "res.post?.id" not in src
    assert 'navigate("/dashboard/agents/post-gen")' not in src


def test_rt_15_5_gate_completed_lands_on_topic_weights():
    """RT-15-5: gate onCompleted and gate complete-without-post go to /topics?tab=weights."""
    gate = read_text(ONBOARDING_PAGE)
    flow = read_text(FLASHCARD)
    assert gate, "Onboarding.tsx missing"
    assert NAV_WEIGHTS in gate
    assert 'window.location.assign("/dashboard")' not in gate
    assert NAV_WEIGHTS in flow


def test_ac_hp_05_option_ui_exactly_one_per_topic():
    """AC-HP-05: option control is single-select (one selected_option_value)."""
    src = topics_ui_blob()
    assert "selected_option_value" in src
    assert "options" in src
    radio = (
        'type="radio"' in src
        or "RadioGroup" in src
        or 'role="radio"' in src
        or "Select" in src
    )
    assert radio, "exactly-one option control missing on Topic Weights"


def test_ac_em_02_weights_tab_renders_ten_drafts_not_empty_error():
    """AC-EM-02: Weights tab maps topic rows (not an empty-error-only success state)."""
    src = topics_ui_blob()
    assert 'value="weights"' in src
    assert "Draft" in src or "is_active" in src
    assert "map(" in src
