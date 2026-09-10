"""TS-22 backend static ACs (schema, debit, roles, catalog 018, OOS cron/improve).

Written from .agent/requirements/TS-22.md, .agent/contracts/TS-22.md, and
.agent/specs/TS-22.md Locked table. Does not reverse-engineer Wave 3 diffs.
"""
from __future__ import annotations

import re

from tests.ts8_helpers import SEED_COSTS, py_function_source
from tests.ts10_helpers import CANONICAL_CONTRACT
from tests.ts11_helpers import SCHEMAS_POST_PY
from tests.ts16_helpers import GENERATE_JOB_PY, POSTS_PY, read_text, require_file
from tests.ts22_helpers import (
    IMAGE_POST_COST,
    MANUAL_POST_COST,
    NO_DESTINATIONS_DETAIL,
    PUBLISH_PY,
    TEXT_POST_COST,
    endpoint_source,
    migrations_018_plus,
    rollbacks_018_plus,
)


def test_ac_hp_04_generate_post_request_has_skip_image():
    """AC-HP-04 / contract §1: GeneratePostRequest JSON field skipImage (camelCase)."""
    src = read_text(SCHEMAS_POST_PY)
    assert src, "schemas/post.py missing"
    assert "class GeneratePostRequest" in src
    req = src.split("class GeneratePostRequest")[-1].split("class ")[0]
    assert "skipImage" in req
    assert "topicId" in req
    assert "sourceUrl" in req


def test_ac_hp_04_generate_passes_skip_image_to_pipeline():
    """AC-HP-04 / contract §1: generate_post_endpoint passes skip_image to run_generation_pipeline."""
    src = read_text(POSTS_PY)
    generate = endpoint_source(src, "generate_post_endpoint")
    assert generate, "generate_post_endpoint missing"
    assert "run_generation_pipeline" in generate
    assert "skip_image" in generate
    assert "quota_slot" not in generate


def test_ac_hp_06_07_generate_consumes_text_or_image_after_pipeline():
    """AC-HP-06/07 / Q-22-03 A: peek credit_balance before pipeline; consume after save."""
    src = read_text(POSTS_PY)
    generate = endpoint_source(src, "generate_post_endpoint")
    assert generate, "generate_post_endpoint missing"
    assert "credit_balance" in generate
    assert "consume_for_action" in generate
    assert "text_post" in generate
    assert "image_post" in generate
    assert "manual_post" not in generate
    i_peek = generate.find("credit_balance")
    i_pipe = generate.find("run_generation_pipeline")
    i_cons = generate.find("consume_for_action")
    assert 0 <= i_peek < i_pipe < i_cons


def test_q_s22_1_generate_requires_owner_admin_editor():
    """Q-S22-1 A: generate_post_endpoint calls require_tenant_roles owner/admin/editor."""
    src = read_text(POSTS_PY)
    generate = endpoint_source(src, "generate_post_endpoint")
    assert generate, "generate_post_endpoint missing"
    assert "require_tenant_roles" in generate
    assert "owner" in generate
    assert "admin" in generate
    assert "editor" in generate


def test_ac_can_03_generate_does_not_refund_on_cancel():
    """AC-CAN-03 / Q-1b: generate handler has no refund; debit stays after Next."""
    src = read_text(POSTS_PY)
    generate = endpoint_source(src, "generate_post_endpoint")
    assert generate
    assert "refund" not in generate.lower()


def test_ac_ctr_01_publish_does_not_consume():
    """AC-CTR-01 / contract §3: Confirm publish must not call consume_for_action."""
    src = read_text(POSTS_PY)
    publish = py_function_source(src, "publish_post_endpoint")
    assert publish, "publish_post_endpoint missing"
    assert "consume_for_action" not in publish


def test_ac_ctr_01_improve_still_does_not_consume():
    """AC-CTR-01: POST /posts/improve still must not debit."""
    src = read_text(POSTS_PY)
    improve = py_function_source(src, "improve_post_endpoint")
    assert improve, "improve_post_endpoint missing"
    assert "consume_for_action" not in improve


def test_ac_oos_01_cron_generate_job_still_skip_image_no_consume():
    """AC-OOS-01: generate_job still skip_image for daily_text; must not consume_for_action."""
    require_file(GENERATE_JOB_PY, "generate_job.py missing")
    src = read_text(GENERATE_JOB_PY)
    assert "skip_image" in src
    assert "daily_text" in src
    assert "consume_for_action" not in src
    assert "_consume_credit" not in src


def test_ac_ctr_02_c_posts_manual_allows_generate_debit():
    """AC-CTR-02: C-posts-manual debit paragraph allows generate text_post/image_post."""
    assert CANONICAL_CONTRACT.is_file(), f"missing {CANONICAL_CONTRACT}"
    canon = CANONICAL_CONTRACT.read_text()
    assert "text_post" in canon
    assert "image_post" in canon
    assert "consume_for_action" in canon
    assert "generate_job" in canon
    lower = canon.lower()
    assert "may call" in lower or "may" in lower
    assert "improve" in lower and "does not debit" in lower


def test_ac_mig_01_018_updates_text_post_10_image_post_30():
    """AC-MIG-01 / Q-9: migration 018+ updates text_post 1→10 and image_post 10→30."""
    files = migrations_018_plus()
    assert files, "migration 018 or higher missing"
    blob = "\n".join(p.read_text() for p in files)
    assert "text_post" in blob
    assert "image_post" in blob
    assert re.search(
        r"credits\s*=\s*10[\s\S]{0,240}text_post|text_post[\s\S]{0,240}credits\s*=\s*10",
        blob,
    )
    assert re.search(
        r"credits\s*=\s*30[\s\S]{0,240}image_post|image_post[\s\S]{0,240}credits\s*=\s*30",
        blob,
    )
    assert not re.search(r"insert\s+into\s+credit_action_costs", blob, re.I)


def test_ac_mig_02_018_does_not_change_manual_post():
    """AC-MIG-02: 018+ does not reprice manual_post (stays 50)."""
    files = migrations_018_plus()
    assert files, "migration 018 or higher missing"
    blob = "\n".join(p.read_text() for p in files)
    assert not re.search(
        r"where\s+action_key\s*=\s*['\"]manual_post['\"]",
        blob,
        re.I,
    )
    by_key = {row["action_key"]: row["credits"] for row in SEED_COSTS}
    assert by_key["manual_post"] == MANUAL_POST_COST


def test_ac_mig_03_018_rollback_restores_1_and_10():
    """AC-MIG-03 / G10: matching rollback restores text_post=1 and image_post=10."""
    files = rollbacks_018_plus()
    assert files, "rollback 018_*_rollback.sql missing"
    blob = "\n".join(p.read_text() for p in files)
    assert re.search(
        r"credits\s*=\s*1[\s\S]{0,240}text_post|text_post[\s\S]{0,240}credits\s*=\s*1",
        blob,
    )
    assert re.search(
        r"credits\s*=\s*10[\s\S]{0,240}image_post|image_post[\s\S]{0,240}credits\s*=\s*10",
        blob,
    )


def test_ac_mig_04_seed_costs_follow_q9():
    """AC-MIG-04: SEED_COSTS live lock is text_post=10, image_post=30, manual_post=50."""
    by_key = {row["action_key"]: row["credits"] for row in SEED_COSTS}
    assert by_key["manual_post"] == MANUAL_POST_COST
    assert by_key["text_post"] == TEXT_POST_COST
    assert by_key["image_post"] == IMAGE_POST_COST


def test_ac_li_02_publish_zero_dest_detail_unchanged():
    """AC-LI-02: POST /posts/{id}/publish still 400 with the locked destinations detail."""
    src = read_text(PUBLISH_PY)
    assert src, "publish.py missing"
    assert NO_DESTINATIONS_DETAIL in src


def test_ac_oos_03_no_second_generate_path_on_posts_router():
    """AC-OOS-03: generate remains POST /posts/generate — no second generate URL in posts.py."""
    src = read_text(POSTS_PY)
    assert '"/generate"' in src or "'/generate'" in src
    assert "/generate-wizard" not in src
