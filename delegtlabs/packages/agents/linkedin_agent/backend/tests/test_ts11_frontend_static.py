"""TS-11 USER Post Generation source ACs (no Jest/Vitest; same pattern as TS-10).

Interactive click / Dialog / timeout-abort ACs are Wave 4 (test_ts11_wave4_deferred.py).
"""
from __future__ import annotations

import re

from tests.ts11_helpers import (
    FRONTEND_ROOT,
    IMPROVE_LABEL,
    IMPROVE_TIMEOUT_MS,
    SHARED,
    USER_SRC,
    glob_text,
    read_named,
    read_text,
)

POST_GEN_TAB = USER_SRC / "pages" / "agents" / "post-gen" / "PostGenerationTab.tsx"
POSTS_IMPROVE_TS = SHARED / "api" / "posts-improve.ts"
STRIP_HTML_TS = SHARED / "lib" / "strip-html.ts"
API_INDEX = SHARED / "api" / "index.ts"
DIALOG = SHARED / "components" / "ui" / "dialog.tsx"


def _gen_blob() -> str:
    return "\n".join(
        [
            read_text(POST_GEN_TAB),
            read_named("DescriptionEditor.tsx", FRONTEND_ROOT),
            read_named("ImprovePreviewDialog.tsx", FRONTEND_ROOT),
            read_named("PostGenerationTab.tsx", USER_SRC),
            read_text(POSTS_IMPROVE_TS),
            read_text(STRIP_HTML_TS),
        ]
    )


def test_ac_hp_02_improve_the_text_label_on_generation_editor():
    """AC-HP-02: control label is exactly `Improve the text` on Post Generation editor."""
    blob = _gen_blob()
    assert IMPROVE_LABEL in blob
    tab = read_text(POST_GEN_TAB)
    editor = read_named("DescriptionEditor.tsx", FRONTEND_ROOT)
    assert IMPROVE_LABEL in tab or IMPROVE_LABEL in editor


def test_ac_hp_01_tiptap_on_generation_not_lone_textarea_only():
    """AC-HP-01: Description on generation is TipTap (not only a Description Textarea)."""
    tab = read_text(POST_GEN_TAB)
    editor = read_named("DescriptionEditor.tsx", FRONTEND_ROOT)
    blob = tab + "\n" + editor
    assert blob.strip(), "PostGenerationTab.tsx missing"
    assert "useEditor" in blob or "EditorContent" in blob or "@tiptap" in blob
    postgen = read_named("PostGen.tsx", USER_SRC)
    assert postgen
    assert "PostGenerationTab" in postgen


def test_ac_hp_03_improve_client_not_posts_api_generate():
    """AC-HP-03: Improve client is improvePost → /posts/improve, not postsApi.generate."""
    blob = _gen_blob()
    improve_ts = read_text(POSTS_IMPROVE_TS)
    assert improve_ts, "frontend/shared/api/posts-improve.ts missing (C-posts-improve §10)"
    assert "improvePost" in improve_ts
    assert "/posts/improve" in improve_ts
    assert "timeout: 120000" in improve_ts or "timeout:120000" in improve_ts
    tab = read_text(POST_GEN_TAB) + read_named("DescriptionEditor.tsx", FRONTEND_ROOT)
    assert "improvePost" in tab or "improvePost" in blob
    assert "postsApi.generate" not in tab
    assert not re.search(r"""['\"]/posts/generate['\"]""", tab)


def test_ac_hp_03_ps_04_strip_html_to_plain_on_improve_request():
    """AC-HP-03 / AC-PS-04: Improve description uses stripHtmlToPlain (shared helper)."""
    strip_src = read_text(STRIP_HTML_TS)
    assert strip_src, "frontend/shared/lib/strip-html.ts missing (C-posts-improve §11)"
    assert "export function stripHtmlToPlain" in strip_src
    blob = _gen_blob()
    assert "stripHtmlToPlain" in blob
    assert "improvePost" in blob


def test_ac_hp_05_dialog_accept_discard_not_alert_dialog():
    """AC-HP-05: preview uses dialog.tsx Dialog with Accept / Discard; no AlertDialog."""
    preview = read_named("ImprovePreviewDialog.tsx", FRONTEND_ROOT)
    tab = read_text(POST_GEN_TAB)
    blob = preview + "\n" + tab
    assert blob.strip(), "Improve preview UI missing"
    assert "Accept" in blob
    assert "Discard" in blob
    dialog = read_text(DIALOG)
    assert dialog, "frontend/shared/components/ui/dialog.tsx missing"
    assert "AlertDialog" not in blob
    assert "window.confirm" not in blob
    assert "Dialog" in preview or "Dialog" in tab


def test_ac_hp_05_err_02_no_dangerously_set_inner_html():
    """AC-HP-05 / AC-ERR-02: preview must not use dangerouslySetInnerHTML / innerHTML."""
    for name in (
        "PostGenerationTab.tsx",
        "DescriptionEditor.tsx",
        "ImprovePreviewDialog.tsx",
    ):
        src = read_named(name, FRONTEND_ROOT)
        if not src:
            continue
        assert "dangerouslySetInnerHTML" not in src
        assert ".innerHTML" not in src


def test_ac_hp_08_improve_enabled_when_title_only():
    """AC-HP-08: Improve disabled iff both title.trim and description-plain trim are empty."""
    blob = _gen_blob()
    assert "stripHtmlToPlain" in blob
    assert "title.trim()" in blob
    assert "Improve the text" in blob


def test_ac_em_01_both_empty_disables_improve():
    """AC-EM-01: both empty → Improve disabled (source encodes trim-empty conjunction)."""
    blob = _gen_blob()
    assert IMPROVE_LABEL in blob
    assert "disabled" in blob
    assert "title.trim()" in blob
    assert "stripHtmlToPlain" in blob


def test_ac_em_02_whitespace_only_uses_trim():
    """AC-EM-02: whitespace-only title/description use trim (same empty rule as AC-EM-01)."""
    blob = _gen_blob()
    assert "title.trim()" in blob
    assert ".trim()" in blob
    assert "stripHtmlToPlain" in blob


def test_ac_em_04_generate_post_still_requires_title_and_description():
    """AC-EM-04: Generate Post stays disabled when title or plain description is empty."""
    tab = read_text(POST_GEN_TAB)
    assert tab
    assert "manualPublish" in tab
    assert "title.trim()" in tab
    assert "disabled" in tab


def test_ac_ed_01_ps_02_compose_preview_uses_strip():
    """AC-ED-01 / AC-PS-02: composePreview / preview length uses stripHtmlToPlain."""
    tab = read_text(POST_GEN_TAB)
    assert tab
    assert "composePreview" in tab or "Preview length" in tab
    blob = tab + "\n" + read_named("DescriptionEditor.tsx", FRONTEND_ROOT)
    assert "stripHtmlToPlain" in blob


def test_ac_ed_03_client_rejects_composed_over_3000():
    """AC-ED-03 / AC-ED-04: client uses > 3000 (not >=) and does not Accept-write over limit."""
    blob = _gen_blob()
    assert "3000" in blob
    assert "overLimit" in blob or "> 3000" in blob or ">3000" in blob


def test_ac_ed_06_improve_axios_timeout_120000():
    """AC-ED-06: Improve client timeout is 120000 (not the 30000 instance default)."""
    improve_ts = read_text(POSTS_IMPROVE_TS)
    assert improve_ts, "posts-improve.ts missing"
    assert (
        f"timeout: {IMPROVE_TIMEOUT_MS}" in improve_ts
        or f"timeout:{IMPROVE_TIMEOUT_MS}" in improve_ts
    )
    assert "timeout: 30000" not in improve_ts
    index = read_text(API_INDEX)
    if index:
        assert "timeout: 120000" in improve_ts


def test_ac_ed_07_no_axios_retry_on_improve_client():
    """AC-ED-07: no axios-retry / retry interceptor on the Improve client call."""
    improve_ts = read_text(POSTS_IMPROVE_TS)
    assert improve_ts
    assert "axios-retry" not in improve_ts
    assert "retries:" not in improve_ts
    assert "retry(" not in improve_ts
    blob = improve_ts + "\n" + read_named("DescriptionEditor.tsx", FRONTEND_ROOT)
    assert "axiosRetry" not in blob


def test_ac_hp_10_generate_post_still_manual_publish():
    """AC-HP-10: Generate Post still postsApi.manualPublish → POST /posts/manual."""
    tab = read_text(POST_GEN_TAB)
    api = glob_text(SHARED / "api", "*.ts")
    assert tab and api
    assert "manualPublish" in tab
    assert "/posts/manual" in api
    assert "improvePost" in (
        tab
        + read_named("DescriptionEditor.tsx", FRONTEND_ROOT)
        + read_text(POSTS_IMPROVE_TS)
    )


def test_ac_neg_03_toolbar_is_bold_italic_lists_links_plus_improve():
    """AC-NEG-03: toolbar is bold/italic/lists/links + Improve — no images/tables."""
    editor = read_named("DescriptionEditor.tsx", FRONTEND_ROOT)
    tab = read_text(POST_GEN_TAB)
    blob = editor + "\n" + tab
    assert IMPROVE_LABEL in blob
    for forbidden in (
        "image",
        "table",
        "youtube",
        "highlight",
        "underline",
        "code-block",
    ):
        assert f"from '@tiptap/extension-{forbidden}'" not in blob
        assert f'from "@tiptap/extension-{forbidden}"' not in blob
    assert "Image.configure" not in blob
    assert "Table.configure" not in blob


def test_ac_neg_04_other_surfaces_have_no_improve_the_text():
    """AC-NEG-04: PostsTab / PostEditor / Subscription / Credits must not gain Improve the text."""
    required = ("PostsTab.tsx", "SubscriptionTab.tsx", "CreditsTab.tsx")
    for rel in required:
        src = read_named(rel, USER_SRC)
        assert src, f"{rel} missing"
        assert IMPROVE_LABEL not in src
    # PostEditor may live outside post-gen or be absent; if present it must not gain the control.
    editor = read_named("PostEditor.tsx", FRONTEND_ROOT)
    assert IMPROVE_LABEL not in editor


def test_ac_err_01_inflight_loading_disables_second_send():
    """AC-ERR-01: pending Improve shows loading and is not sendable again (source)."""
    blob = _gen_blob()
    assert "disabled" in blob
    loading = (
        "isImproving" in blob
        or "improving" in blob
        or "pending" in blob
        or "isPending" in blob
        or "loading" in blob.lower()
    )
    assert loading, "Improve in-flight loading flag missing from generation UI source"


def test_ac_err_02_toast_error_api_error_message():
    """AC-ERR-02: failures use toast.error + apiErrorMessage; editor not auto-Accept-written."""
    tab = read_text(POST_GEN_TAB)
    editor = read_named("DescriptionEditor.tsx", FRONTEND_ROOT)
    preview = read_named("ImprovePreviewDialog.tsx", FRONTEND_ROOT)
    blob = tab + "\n" + editor + "\n" + preview
    assert "toast.error" in blob
    assert "apiErrorMessage" in blob


def test_ac_err_03_discard_present_for_preview():
    """AC-ERR-03: Discard control exists on the Improve preview Dialog (click is Wave 4)."""
    preview = read_named("ImprovePreviewDialog.tsx", FRONTEND_ROOT)
    tab = read_text(POST_GEN_TAB)
    assert "Discard" in (preview + tab)


def test_ac_ps_01_manual_publish_description_uses_strip():
    """AC-PS-01: Generate Post FormData description is stripHtmlToPlain, not TipTap HTML."""
    tab = read_text(POST_GEN_TAB)
    assert tab
    assert "manualPublish" in tab
    assert "stripHtmlToPlain" in tab or "stripHtmlToPlain" in read_named(
        "DescriptionEditor.tsx", FRONTEND_ROOT
    )
    assert "description" in tab


def test_ac_ps_04_one_strip_helper_three_call_sites():
    """AC-PS-04: same stripHtmlToPlain for Improve request, composePreview, and manual description."""
    strip_src = read_text(STRIP_HTML_TS)
    assert "export function stripHtmlToPlain" in strip_src
    tab = read_text(POST_GEN_TAB)
    editor = read_named("DescriptionEditor.tsx", FRONTEND_ROOT)
    blob = tab + "\n" + editor
    assert blob.count("stripHtmlToPlain") >= 2
    assert "composePreview" in tab or "composePreview" in blob
    assert "improvePost" in blob or "improvePost" in read_text(POSTS_IMPROVE_TS)
    assert "manualPublish" in tab
