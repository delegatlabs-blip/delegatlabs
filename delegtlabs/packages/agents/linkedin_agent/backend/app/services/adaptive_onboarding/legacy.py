"""Map legacy static onboarding answers into Content DNA."""
from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

from app.services.adaptive_onboarding.coverage import calculate_coverage
from app.services.adaptive_onboarding.normalize import apply_identity_answer
from app.services.adaptive_onboarding.question_bank import first_question
from app.services.adaptive_onboarding.schema import ContentDNA, SessionState
from app.services.adaptive_onboarding.weights import load_limits


def _as_list(value: Any) -> list:
    if isinstance(value, list):
        return [str(v) for v in value if str(v).strip()]
    if value:
        return [str(value)]
    return []


def legacy_to_dna(answers: Dict[str, Any]) -> Tuple[ContentDNA, SessionState]:
    profile = ContentDNA(onboarding_version="legacy-mapped")
    session = SessionState()
    if not answers:
        session.current_question = first_question()
        return profile, session

    if answers.get("industries"):
        apply_identity_answer(profile, answers["industries"], "legacy_industries")
        session.asked_ids.append("q_identity_domain")
        session.identity_depth += 1
        session.questions_answered += 1

    mapping = [
        ("targetAudience", "primary_audience"),
        ("contentGoal", "primary_goal"),
        ("tone", "tone"),
        ("contentFormats", "preferred_formats"),
        ("topicsOfInterest", "preferred_topics"),
        ("opinionStyle", "opinion_strength"),
        ("trendingNews", "news_interest"),
        ("postLength", "preferred_length"),
        ("ctaUsage", "cta_style"),
        ("emojiUsage", "emoji_preference"),
        ("styleReference", "creators_user_likes"),
    ]
    for src, dest in mapping:
        val = answers.get(src)
        if val in (None, "", []):
            continue
        profile.set_field(dest, val if isinstance(val, list) else val, source="legacy", confidence=0.85, question_id=f"legacy_{src}")
        session.questions_answered += 1

    coverage = calculate_coverage(profile)
    session.coverage = coverage
    limits = load_limits()
    complete = bool(
        _as_list(answers.get("industries"))
        and answers.get("targetAudience")
        and answers.get("contentGoal")
        and answers.get("tone")
        and _as_list(answers.get("topicsOfInterest"))
    )
    if complete or (session.questions_answered >= limits.min_questions and coverage >= limits.target_coverage):
        session.status = "completed"
        session.current_question = None
    else:
        session.current_question = first_question()
        if "q_identity_domain" in session.asked_ids:
            from app.services.adaptive_onboarding.question_bank import fallback_question

            session.current_question = fallback_question(profile, session.asked_ids)
    return profile, session


def dna_to_legacy(profile: ContentDNA) -> Dict[str, Any]:
    def first(lst: list, fallback: str = "") -> str:
        return str(lst[0]) if lst else fallback

    return {
        "industries": list(profile.industries),
        "targetAudience": ", ".join(profile.primary_audience),
        "contentGoal": first(profile.primary_goal),
        "tone": first(profile.tone),
        "contentFormats": list(profile.preferred_formats),
        "topicsOfInterest": list(profile.preferred_topics or profile.content_pillars),
        "opinionStyle": profile.opinion_strength or first(profile.strong_opinions),
        "trendingNews": profile.news_interest or "",
        "postLength": profile.preferred_length or "",
        "ctaUsage": profile.cta_style or "",
        "emojiUsage": profile.emoji_preference or "",
        "styleReference": ", ".join(profile.creators_user_likes),
    }
