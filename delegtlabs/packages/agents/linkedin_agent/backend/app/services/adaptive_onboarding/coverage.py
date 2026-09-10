"""Weighted Content DNA coverage."""
from __future__ import annotations

from app.services.adaptive_onboarding.schema import ContentDNA
from app.services.adaptive_onboarding.weights import DIMENSION_WEIGHTS, OnboardingLimits


def calculate_coverage(profile: ContentDNA) -> float:
    total = 0.0
    filled = 0.0
    for field, weight in DIMENSION_WEIGHTS.items():
        total += weight
        if profile.is_filled(field):
            filled += weight
    if total <= 0:
        return 0.0
    score = filled / total
    profile.profile_coverage = round(score, 4)
    return profile.profile_coverage


def should_end_onboarding(
    profile: ContentDNA,
    questions_answered: int,
    limits: OnboardingLimits,
) -> bool:
    coverage = calculate_coverage(profile)
    if questions_answered >= limits.max_questions:
        return True
    if questions_answered >= limits.min_questions and coverage >= limits.target_coverage:
        return True
    return False
