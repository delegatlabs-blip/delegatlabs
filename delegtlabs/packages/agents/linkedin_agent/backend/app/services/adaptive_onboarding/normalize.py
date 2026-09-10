"""Map answers onto Content DNA without dropping raw values."""
from __future__ import annotations

from typing import Any, List, Tuple

from app.services.adaptive_onboarding.schema import ContentDNA, FieldSource, RawAnswer
from app.services.adaptive_onboarding.taxonomies import (
    answer_strings,
    classify_free_text,
    industry_to_domain,
)

LIST_FIELDS = {
    "industries",
    "skills",
    "technologies",
    "expertise_areas",
    "sub_specialties",
    "primary_audience",
    "audience_roles",
    "audience_industries",
    "audience_problems",
    "audience_aspirations",
    "primary_goal",
    "content_pillars",
    "preferred_topics",
    "avoided_topics",
    "experiences",
    "strong_opinions",
    "beliefs",
    "preferred_formats",
    "tone",
    "prohibited_topics",
    "creators_user_likes",
    "writing_samples",
}


def answer_method_for(question_options: List[str], value: Any) -> str:
    parts = answer_strings(value)
    if not parts:
        return "predefined"
    preset = set(question_options)
    custom = [p for p in parts if p not in preset]
    if custom and len(custom) == len(parts):
        return "custom"
    if custom:
        return "mixed"
    return "predefined"


def apply_direct_fields(
    profile: ContentDNA,
    fields: List[str],
    value: Any,
    *,
    question_id: str,
    source: FieldSource = "answer",
    confidence: float = 1.0,
) -> List[str]:
    written: List[str] = []
    parts = answer_strings(value)
    if not parts:
        return written
    for field in fields:
        if field in LIST_FIELDS:
            profile.set_field(
                field, parts, source=source, confidence=confidence, question_id=question_id
            )
        else:
            profile.set_field(
                field, parts[0], source=source, confidence=confidence, question_id=question_id
            )
        written.append(field)
    return written


def apply_identity_answer(profile: ContentDNA, value: Any, question_id: str) -> List[str]:
    written = apply_direct_fields(
        profile, ["industries"], value, question_id=question_id, source="answer"
    )
    for item in answer_strings(value):
        domain, profession = industry_to_domain(item)
        profile.set_field(
            "primary_domain",
            domain,
            source="inferred",
            confidence=0.8,
            question_id=question_id,
        )
        written.append("primary_domain")
        if profession:
            profile.set_field(
                "profession",
                profession,
                source="inferred",
                confidence=0.75,
                question_id=question_id,
            )
            written.append("profession")
        for upd in classify_free_text(item):
            profile.set_field(
                upd.field,
                upd.value,
                source=upd.source,
                confidence=upd.confidence,
                question_id=question_id,
            )
            written.append(upd.field)
    return list(dict.fromkeys(written))


def remember_raw(profile: ContentDNA, question_id: str, value: Any, method: str) -> None:
    profile.raw_answers.append(
        RawAnswer(question_id=question_id, value=value, answer_method=method)
    )
