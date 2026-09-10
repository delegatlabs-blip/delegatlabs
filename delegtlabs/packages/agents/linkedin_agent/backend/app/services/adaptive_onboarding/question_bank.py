"""Deterministic high-value question bank."""
from __future__ import annotations

import re
from typing import List, Optional

from app.services.adaptive_onboarding.schema import AdaptiveQuestion, ContentDNA, SessionState
from app.services.adaptive_onboarding.taxonomies import (
    AUDIENCE_OPTIONS,
    AUDIENCE_PROBLEM_OPTIONS,
    AVOID_OPTIONS,
    CARDIOLOGY_AREA_OPTIONS,
    EXPERIENCE_OPTIONS,
    FORMAT_OPTIONS,
    FOUNDER_CUSTOMER_OPTIONS,
    FOUNDER_INDUSTRY_OPTIONS,
    GOAL_OPTIONS,
    INDUSTRY_OPTIONS,
    LEGAL_AREA_OPTIONS,
    MEDICAL_SPECIALTY_OPTIONS,
    PILLAR_OPTIONS,
    POV_OPTIONS,
    SOFTWARE_AREA_OPTIONS,
    TECH_EXPERIENCE_OPTIONS,
    TONE_OPTIONS,
    has_tech_context,
    profession_key,
)


def _q(**kwargs) -> AdaptiveQuestion:
    kwargs.setdefault("generatedBy", "system")
    kwargs.setdefault("required", True)
    return AdaptiveQuestion(**kwargs)


def first_question() -> AdaptiveQuestion:
    return _q(
        id="q_identity_domain",
        category="identity",
        profileFieldsTargeted=["industries", "primary_domain", "profession"],
        title="What primary industries or domains do you create content for?",
        description="Select all that apply. The next questions are chosen from your selection.",
        type="multi_select",
        options=INDUSTRY_OPTIONS,
        allowOther=True,
        otherPlaceholder="e.g. Doctor, Lawyer, Underwater robotics researcher...",
        importance=1.0,
        estimatedEffort=0.25,
    )


def all_bank_questions() -> List[AdaptiveQuestion]:
    return [
        first_question(),
        _q(
            id="q_software_area",
            category="specialization",
            profileFieldsTargeted=["specialty", "role"],
            title="Which area best represents your work?",
            description="Pick the closest match. This steers technical follow-ups.",
            type="single_select",
            options=SOFTWARE_AREA_OPTIONS,
            allowOther=True,
            otherPlaceholder="Describe your area...",
            importance=0.85,
            estimatedEffort=0.2,
            dependsOn={"tech_context": True},
        ),
        _q(
            id="q_tech_experience",
            category="expertise",
            profileFieldsTargeted=["technologies", "expertise_areas"],
            title="Which technologies or architectural problems do you have the strongest real-world experience with?",
            type="multi_select",
            options=TECH_EXPERIENCE_OPTIONS,
            allowOther=True,
            otherPlaceholder="Add a technology or problem space...",
            importance=0.75,
            estimatedEffort=0.3,
            dependsOn={"tech_context": True, "software_area": True},
        ),
        _q(
            id="q_medical_specialty",
            category="specialization",
            profileFieldsTargeted=["specialty"],
            title="What is your primary medical specialty?",
            type="single_select",
            options=MEDICAL_SPECIALTY_OPTIONS,
            allowOther=True,
            otherPlaceholder="Your specialty...",
            importance=0.9,
            estimatedEffort=0.2,
            dependsOn={"profession": "physician"},
        ),
        _q(
            id="q_cardiology_area",
            category="specialization",
            profileFieldsTargeted=["sub_specialties"],
            title="Which area of cardiology best represents your expertise?",
            type="single_select",
            options=CARDIOLOGY_AREA_OPTIONS,
            allowOther=True,
            importance=0.55,
            estimatedEffort=0.2,
            dependsOn={"specialty_contains": "cardio"},
        ),
        _q(
            id="q_legal_area",
            category="specialization",
            profileFieldsTargeted=["specialty"],
            title="Which area of law best represents your work?",
            type="single_select",
            options=LEGAL_AREA_OPTIONS,
            allowOther=True,
            importance=0.85,
            estimatedEffort=0.2,
            dependsOn={"profession": "lawyer"},
        ),
        _q(
            id="q_founder_industry",
            category="identity",
            profileFieldsTargeted=["current_professional_context"],
            title="What industry is the company in?",
            type="single_select",
            options=FOUNDER_INDUSTRY_OPTIONS,
            allowOther=True,
            importance=0.92,
            estimatedEffort=0.2,
            dependsOn={"profession": "founder"},
        ),
        _q(
            id="q_founder_customer",
            category="audience",
            profileFieldsTargeted=["audience_industries", "current_professional_context"],
            title="Who is the customer?",
            type="single_select",
            options=FOUNDER_CUSTOMER_OPTIONS,
            allowOther=True,
            importance=0.7,
            estimatedEffort=0.15,
            dependsOn={"profession": "founder"},
        ),
        _q(
            id="q_audience",
            category="audience",
            profileFieldsTargeted=["primary_audience", "audience_roles"],
            title="Who do you most want your LinkedIn content to reach?",
            description="Choose the people whose attention would make the posts worth writing.",
            type="multi_select",
            options=AUDIENCE_OPTIONS,
            allowOther=True,
            otherPlaceholder="Describe the audience...",
            importance=1.0,
            estimatedEffort=0.25,
            dependsOn={"has_identity": True},
        ),
        _q(
            id="q_audience_problems",
            category="audience",
            profileFieldsTargeted=["audience_problems"],
            title="What problems should this audience associate you with?",
            type="multi_select",
            options=AUDIENCE_PROBLEM_OPTIONS,
            allowOther=False,
            importance=0.95,
            estimatedEffort=0.25,
            dependsOn={"has_audience": True},
        ),
        _q(
            id="q_goals",
            category="goals",
            profileFieldsTargeted=["primary_goal"],
            title="What should your LinkedIn posts accomplish most?",
            type="multi_select",
            options=GOAL_OPTIONS,
            allowOther=True,
            importance=0.95,
            estimatedEffort=0.2,
            dependsOn={"has_identity": True},
        ),
        _q(
            id="q_pillars",
            category="topics",
            profileFieldsTargeted=["content_pillars", "preferred_topics"],
            title="Which content themes can you sustain for months without repeating yourself?",
            type="multi_select",
            options=PILLAR_OPTIONS,
            allowOther=False,
            importance=0.9,
            estimatedEffort=0.25,
            dependsOn={"has_identity": True},
        ),
        _q(
            id="q_experiences",
            category="authority",
            profileFieldsTargeted=["experiences"],
            title="Which lived experiences should your posts draw from?",
            description="Pick what you are willing to speak about. Nothing is invented for you.",
            type="multi_select",
            options=EXPERIENCE_OPTIONS,
            allowOther=False,
            importance=0.9,
            estimatedEffort=0.25,
            dependsOn={"has_identity": True},
        ),
        _q(
            id="q_pov",
            category="authority",
            profileFieldsTargeted=["strong_opinions", "beliefs"],
            title="Which stance is closest to how you want to show up?",
            type="multi_select",
            options=POV_OPTIONS,
            allowOther=False,
            importance=0.9,
            estimatedEffort=0.25,
            dependsOn={"has_identity": True},
        ),
        _q(
            id="q_avoid",
            category="boundaries",
            profileFieldsTargeted=["prohibited_topics", "avoided_topics"],
            title="What should we never treat as your expertise?",
            type="multi_select",
            options=AVOID_OPTIONS,
            required=False,
            allowOther=False,
            importance=0.65,
            estimatedEffort=0.2,
            dependsOn={"has_identity": True},
        ),
        _q(
            id="q_formats",
            category="style",
            profileFieldsTargeted=["preferred_formats"],
            title="Which post shapes do you actually enjoy publishing?",
            type="multi_select",
            options=FORMAT_OPTIONS,
            allowOther=True,
            importance=0.6,
            estimatedEffort=0.2,
            dependsOn={"has_identity": True},
        ),
        _q(
            id="q_tone",
            category="voice",
            profileFieldsTargeted=["tone"],
            title="What tone of voice fits your style best?",
            type="single_select",
            options=TONE_OPTIONS,
            importance=0.45,
            estimatedEffort=0.15,
            dependsOn={"has_identity": True},
        ),
        _q(
            id="q_length",
            category="style",
            profileFieldsTargeted=["preferred_length"],
            title="What is your preferred post length?",
            type="single_select",
            options=[
                {"value": "short", "label": "Short & punchy (150–250 words)"},
                {"value": "medium", "label": "Medium depth (250–400 words)"},
                {"value": "long", "label": "Long-form (400–600 words)"},
            ],
            importance=0.35,
            estimatedEffort=0.1,
            dependsOn={"has_identity": True},
        ),
        _q(
            id="q_cta",
            category="style",
            profileFieldsTargeted=["cta_style"],
            title="How should calls-to-action be used?",
            type="single_select",
            options=[
                {"value": "Always include a question/CTA", "label": "Always include a question or CTA"},
                {"value": "Sometimes when relevant", "label": "Sometimes when natural"},
                {"value": "Never include CTAs", "label": "Never include CTAs"},
            ],
            importance=0.3,
            estimatedEffort=0.1,
            dependsOn={"has_identity": True},
        ),
        _q(
            id="q_news",
            category="topics",
            profileFieldsTargeted=["news_interest"],
            title="Should posts react to news and releases in your field?",
            type="single_select",
            options=[
                {"value": "Frequently", "label": "Frequently"},
                {"value": "Occasionally", "label": "Occasionally"},
                {"value": "Evergreen only", "label": "Evergreen only"},
            ],
            importance=0.35,
            estimatedEffort=0.1,
            dependsOn={"has_identity": True},
        ),
        _q(
            id="q_emoji",
            category="voice",
            profileFieldsTargeted=["emoji_preference"],
            title="What is your preferred emoji density?",
            type="single_select",
            options=[
                {"value": "None", "label": "None (clean text)"},
                {"value": "Minimal", "label": "Minimal (1–3 per post)"},
                {"value": "Frequent", "label": "Frequent (4–8 per post)"},
            ],
            importance=0.12,
            estimatedEffort=0.1,
            dependsOn={"has_identity": True},
        ),
    ]


def _deps_ready(q: AdaptiveQuestion, profile: ContentDNA) -> bool:
    deps = q.dependsOn or {}
    pkey = profession_key(profile.profession)
    if deps.get("tech_context") and not has_tech_context(profile.industries, profile.profession):
        return False
    if deps.get("software_area") and not (
        profile.is_filled("specialty") or profile.is_filled("role")
    ):
        if pkey != "software" and not has_tech_context(profile.industries, profile.profession):
            return False
    if deps.get("profession"):
        if pkey != deps["profession"]:
            return False
    if deps.get("specialty_contains"):
        spec = (profile.specialty or "").lower()
        if deps["specialty_contains"] not in spec:
            return False
    if deps.get("has_identity") and not (
        profile.is_filled("profession") or profile.is_filled("primary_domain") or profile.industries
    ):
        return False
    if deps.get("has_audience") and not profile.is_filled("primary_audience"):
        return False
    return True


SELECTABLE_TYPES = {"single_select", "multi_select"}


def eligible_bank_questions(profile: ContentDNA, asked_ids: List[str]) -> List[AdaptiveQuestion]:
    out: List[AdaptiveQuestion] = []
    for q in all_bank_questions():
        if q.id in asked_ids:
            continue
        if q.type not in SELECTABLE_TYPES:
            continue
        if not q.options or len(q.options) < 2:
            continue
        if all(profile.is_filled(f) for f in q.profileFieldsTargeted):
            continue
        if _deps_ready(q, profile):
            out.append(q)
    return out


def fallback_question(profile: ContentDNA, asked_ids: List[str]) -> Optional[AdaptiveQuestion]:
    eligible = eligible_bank_questions(profile, asked_ids)
    if eligible:
        return max(eligible, key=lambda q: q.importance)
    return first_question() if "q_identity_domain" not in asked_ids else None


def coerce_selectable_current(profile: ContentDNA, session: SessionState) -> None:
    if session.status == "completed":
        return
    q = session.current_question
    if q is None or q.type not in SELECTABLE_TYPES or not q.options or len(q.options) < 2:
        session.current_question = fallback_question(profile, session.asked_ids) or first_question()


def normalize_title(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (title or "").lower()).strip()
