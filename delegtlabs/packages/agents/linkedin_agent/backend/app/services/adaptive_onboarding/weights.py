"""Dimension weights and stopping-rule config."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

# Content-value weights for coverage + scoring (user priority order).
DIMENSION_WEIGHTS: Dict[str, float] = {
    "profession": 1.0,
    "primary_domain": 0.95,
    "specialty": 0.85,
    "industries": 0.8,
    "technologies": 0.7,
    "expertise_areas": 0.75,
    "primary_audience": 1.0,
    "audience_problems": 0.95,
    "primary_goal": 0.95,
    "content_pillars": 0.9,
    "experiences": 0.9,
    "strong_opinions": 0.9,
    "sub_specialties": 0.55,
    "preferred_topics": 0.7,
    "prohibited_topics": 0.65,
    "preferred_formats": 0.6,
    "tone": 0.45,
    "preferred_length": 0.35,
    "cta_style": 0.3,
    "news_interest": 0.35,
    "emoji_preference": 0.12,
    "hashtag_preference": 0.08,
    "creators_user_likes": 0.25,
}

IDENTITY_FIELDS = {
    "profession",
    "primary_domain",
    "specialty",
    "sub_specialties",
    "industries",
    "technologies",
    "role",
    "current_professional_context",
}

TECH_INDUSTRY_IDS = {
    "Web Development",
    "AI/ML",
    "DevOps",
    "Mobile Development",
    "Cloud/Infra",
    "Cybersecurity",
    "Data Science",
    "Product/Design",
}

PHYSICIAN_ALIASES = {
    "physician",
    "doctor",
    "md",
    "medical doctor",
    "clinician",
}
LAWYER_ALIASES = {"lawyer", "attorney", "counsel", "advocate"}
FOUNDER_ALIASES = {"founder", "startup founder", "co-founder", "cofounder"}


@dataclass(frozen=True)
class OnboardingLimits:
    min_questions: int = 6
    max_questions: int = 14
    target_coverage: float = 0.80


def load_limits() -> OnboardingLimits:
    try:
        from app.core.config import settings

        return OnboardingLimits(
            min_questions=int(settings.ONBOARDING_MIN_QUESTIONS),
            max_questions=int(settings.ONBOARDING_MAX_QUESTIONS),
            target_coverage=float(settings.ONBOARDING_TARGET_COVERAGE),
        )
    except Exception:
        return OnboardingLimits()
