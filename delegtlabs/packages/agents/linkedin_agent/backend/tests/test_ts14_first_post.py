"""TS-14: Generate My First Posts must not pass an inactive topic id into generation."""
from __future__ import annotations

from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
FRONTEND = BACKEND.parent / "frontend"
ADAPTIVE = BACKEND / "app" / "api" / "endpoints" / "onboarding_adaptive.py"
FLOW = FRONTEND / "shared" / "components" / "onboarding" / "FlashcardFlow.tsx"
GEN = BACKEND / "app" / "services" / "generation.py"


def test_adaptive_complete_does_not_auto_activate_draft_topic():
    """TS-15 Q-4/Q-12 + TS-16 Q-11: complete must not generate posts or force-activate a Draft."""
    src = ADAPTIVE.read_text()
    assert "run_generation_pipeline" not in src
    assert "_generation_topic_id" not in src


def test_generation_still_requires_active_topic():
    src = GEN.read_text()
    assert "is_active = true" in src
    assert "not found or inactive" in src


def test_flashcard_navigates_to_post_gen_on_first_post():
    """TS-16 Q-11 A: complete must not generate; gate lands on Topic Weights, not a first post."""
    src = FLOW.read_text()
    assert "/topics?tab=weights" in src
    assert "res.post?.id" not in src
    assert "run_generation_pipeline" not in src
