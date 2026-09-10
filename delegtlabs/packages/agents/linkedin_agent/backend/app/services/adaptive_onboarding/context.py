"""Task-scoped Content DNA context for generation prompts."""
from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

from app.services.adaptive_onboarding.schema import ContentDNA

TOPIC_FIELDS = (
    "profession",
    "primary_domain",
    "specialty",
    "sub_specialties",
    "expertise_areas",
    "technologies",
    "industries",
    "primary_audience",
    "audience_problems",
    "content_pillars",
    "preferred_topics",
    "strong_opinions",
    "news_interest",
    "primary_goal",
    "avoided_topics",
)

WRITE_FIELDS = TOPIC_FIELDS + (
    "tone",
    "preferred_formats",
    "hook_style",
    "cta_style",
    "preferred_length",
    "emoji_preference",
    "writing_samples",
    "prohibited_topics",
    "confidentiality_rules",
    "claims_to_avoid",
    "experiences",
    "opinion_strength",
)


def _pick(profile: ContentDNA, fields: Iterable[str]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for field in fields:
        if profile.is_filled(field):
            out[field] = getattr(profile, field)
    return out


def build_content_context(profile: Optional[ContentDNA], task: str) -> Dict[str, Any]:
    if profile is None:
        return {}
    if task == "topic_generation":
        return _pick(profile, TOPIC_FIELDS)
    return _pick(profile, WRITE_FIELDS)


def format_context_guidelines(ctx: Dict[str, Any]) -> str:
    if not ctx:
        return ""
    lines = []
    labels = {
        "profession": "Profession",
        "primary_domain": "Domain",
        "specialty": "Specialty",
        "sub_specialties": "Sub-specialties",
        "expertise_areas": "Expertise",
        "technologies": "Technologies / problems",
        "industries": "Industries",
        "primary_audience": "Target audience",
        "audience_problems": "Audience problems",
        "content_pillars": "Content pillars",
        "preferred_topics": "Preferred topics",
        "strong_opinions": "Point of view",
        "news_interest": "News posture",
        "primary_goal": "Content goals",
        "avoided_topics": "Avoid",
        "tone": "Tone",
        "preferred_formats": "Preferred formats",
        "hook_style": "Hook style",
        "cta_style": "CTA",
        "preferred_length": "Length",
        "emoji_preference": "Emoji",
        "writing_samples": "Writing cues",
        "prohibited_topics": "Prohibited topics",
        "confidentiality_rules": "Confidentiality",
        "claims_to_avoid": "Claims to avoid",
        "experiences": "Lived experience (user-stated only)",
        "opinion_strength": "Opinion strength",
    }
    for key, label in labels.items():
        if key not in ctx:
            continue
        val = ctx[key]
        text = ", ".join(str(x) for x in val) if isinstance(val, list) else str(val)
        if text.strip():
            lines.append(f"- {label}: {text}")
    return "\n".join(lines)
