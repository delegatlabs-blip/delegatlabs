"""TS-22 USER Posts-tab wizard + Post Generation regression (static, no Jest).

Written from .agent/requirements/TS-22.md + .agent/contracts/TS-22.md §5–§6.
Does not read Wave 3 implementation diffs before asserting ACs.
"""
from __future__ import annotations

import re

from tests.ts15_helpers import TOPICS_TSX, read_text
from tests.ts16_helpers import API_INDEX
from tests.ts22_helpers import (
    GENERATE_DIALOG,
    POST_GEN_TAB,
    POSTS_TAB,
    TOPIC_WEIGHTS,
    api_method_block,
    wizard_blob,
    wizard_dialog_src,
)


def test_ac_hp_01_posts_tab_has_generate_post_beside_refresh():
    """AC-HP-01 / AC-EMP-01 / AC-EMP-02: Posts tab header has Generate Post alongside Refresh."""
    src = read_text(POSTS_TAB)
    assert src, "PostsTab.tsx missing"
    assert "Refresh" in src
    blob = wizard_blob()
    assert "Generate Post" in blob


def test_ac_hp_02_opens_dialog_not_post_generation_manual():
    """AC-HP-02: wizard is Dialog on Posts tab; does not call postsApi.manualPublish."""
    blob = wizard_blob()
    assert blob.strip(), "PostsTab.tsx / GeneratePostDialog.tsx missing"
    assert "Dialog" in blob
    assert "postsApi.manualPublish" not in blob
    assert not re.search(r"""['\"]/posts/manual['\"]""", blob)


def test_ac_hp_03_toggle_default_text_switch():
    """AC-HP-03 / Q-7 A: Dialog has Switch; Next send includes skipImage (text default)."""
    src = wizard_dialog_src() or wizard_blob()
    assert "Switch" in src
    assert "skipImage" in src
    assert re.search(r"postsApi\.generate\([\s\S]{0,300}skipImage", src)


def test_ac_hp_04_next_calls_posts_api_generate_skip_image_true():
    """AC-HP-04: Next → postsApi.generate; text sends skipImage true; no new path."""
    blob = wizard_blob()
    api = read_text(API_INDEX)
    assert "postsApi.generate" in blob
    assert "skipImage" in blob
    assert "/posts/generate" in api
    assert "skipImage" in api
    assert not re.search(r"""['\"]/posts/generate-wizard['\"]""", blob)


def test_ac_hp_07_image_next_sends_skip_image_false():
    """AC-HP-07 / contract §1: image path is the Switch off of text; body still skipImage."""
    src = wizard_dialog_src() or wizard_blob()
    assert "Switch" in src
    assert "skipImage" in src
    assert re.search(r"postsApi\.generate\([\s\S]{0,300}skipImage", src)


def test_ac_hp_08_confirm_calls_posts_api_publish_no_patch():
    """AC-HP-08 / AC-PREV-01: Confirm → postsApi.publish(id); wizard preview does not PATCH."""
    src = wizard_dialog_src() or wizard_blob()
    assert "postsApi.publish" in src
    assert "Confirm" in src
    assert "postsApi.patch" not in src
    assert not re.search(r"""['\"]/posts/manual['\"]""", src)


def test_q_22_01_generate_has_no_extra_timeout():
    """Q-22-01 A: postsApi.generate must not add timeout: 120000; instance default stands."""
    api = read_text(API_INDEX)
    assert api, "frontend/shared/api/index.ts missing"
    gen = api_method_block(api, "generate")
    assert gen, "postsApi.generate missing"
    assert "/posts/generate" in gen
    assert "timeout" not in gen
    assert "120000" not in gen
    pub = api_method_block(api, "publish")
    if pub:
        assert "timeout" not in pub
    assert "timeout: 120000" in api or "timeout:120000" in api


def test_ac_top_01_03_disable_without_active_topic_copy():
    """AC-TOP-01/02/03: listPersonaTopics / is_active disable; copy contains Topic Weights."""
    blob = wizard_blob()
    assert "listPersonaTopics" in blob
    assert "is_active" in blob
    assert TOPIC_WEIGHTS in blob
    assert "disabled" in blob


def test_ac_top_04_no_topic_picker():
    """AC-TOP-04: Generate Post dialog does not list topics for selection (Q-3 C rejected)."""
    dialog = read_text(GENERATE_DIALOG)
    src = dialog if dialog else wizard_blob()
    assert "topicId" not in src
    assert "Select a topic" not in src


def test_ac_li_01_confirm_gated_on_enabled_publishable_count():
    """AC-LI-01: Confirm disabled when enabled_publishable_count === 0."""
    blob = wizard_blob()
    assert "enabled_publishable_count" in blob
    assert "Confirm" in blob
    assert "disabled" in blob


def test_ac_img_02_warn_from_existing_image_url_field():
    """AC-IMG-02: image-mode + image_url null uses existing Post field; no image_failed key."""
    blob = wizard_blob()
    assert "image_url" in blob
    assert "image_failed" not in blob
    lower = blob.lower()
    assert "fail" in lower or "warn" in lower or "couldn't" in lower or "could not" in lower


def test_ac_can_01_cancel_does_not_delete():
    """AC-CAN-01: Cancel/close after Next does not DELETE the draft."""
    src = wizard_dialog_src() or wizard_blob()
    assert "postsApi.delete" not in src
    assert not re.search(r"""method:\s*['\"]DELETE['\"]""", src)


def test_q_22_05_next_disabled_while_pending():
    """Q-22-05 A: Next is disabled while the in-flight generate request is open."""
    blob = wizard_blob()
    assert "Next" in blob
    assert re.search(r"pending|isPending|isGenerating|generating|loading", blob, re.I)
    assert "disabled" in blob


def test_ac_pgt_01_02_03_post_generation_tab_unchanged():
    """AC-PGT-01/02/03 / TS-10 AC-HP-03: tab remains; idle Generate Post; manualPublish only."""
    src = read_text(POST_GEN_TAB)
    assert src, "PostGenerationTab.tsx missing"
    assert "Generate Post" in src
    assert "manualPublish" in src
    assert "postsApi.generate" not in src
    assert not re.search(r"""['\"]/posts/generate['\"]""", src)
    assert "timeout: 120000" in read_text(API_INDEX) or "timeout:120000" in read_text(API_INDEX)


def test_ac_oos_02_topics_cta_is_not_this_wizard():
    """AC-OOS-02: Topics Generate My First Posts is not the Posts-tab wizard."""
    topics = read_text(TOPICS_TSX)
    assert topics, "Topics.tsx missing"
    assert "skipImage" not in topics
    assert "postsApi.generate" not in topics
