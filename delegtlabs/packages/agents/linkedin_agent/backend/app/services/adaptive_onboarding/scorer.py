"""Score and rank candidate questions."""
from __future__ import annotations

from typing import List, Tuple

from app.services.adaptive_onboarding.question_bank import normalize_title
from app.services.adaptive_onboarding.schema import AdaptiveQuestion, ContentDNA, SessionState
from app.services.adaptive_onboarding.taxonomies import has_tech_context, profession_key
from app.services.adaptive_onboarding.weights import DIMENSION_WEIGHTS, IDENTITY_FIELDS


def _uncertainty(profile: ContentDNA, fields: List[str]) -> float:
    if not fields:
        return 0.3
    missing = [f for f in fields if not profile.is_filled(f)]
    return len(missing) / len(fields)


def _relevance(q: AdaptiveQuestion, profile: ContentDNA, session: SessionState) -> float:
    pkey = profession_key(profile.profession)
    fields = set(q.profileFieldsTargeted)
    if "specialty" in fields:
        if not (profile.profession or profile.industries):
            return 0.0
        if pkey in {"physician", "lawyer", "veterinarian"} and not profile.specialty:
            return 1.0
        if pkey == "software" or profile.industries:
            return 0.9
        return 0.4
    if "sub_specialties" in fields:
        if not profile.specialty:
            return 0.0
        if session.identity_depth >= 2:
            return 0.25
        return 0.45
    if fields & {"primary_audience", "audience_roles"}:
        if not (profile.profession or profile.primary_domain or profile.industries):
            return 0.0
        needs_spec = pkey in {"physician", "lawyer", "veterinarian"} and not profile.specialty
        if needs_spec and session.identity_depth < 2:
            return 0.35
        tech = has_tech_context(profile.industries, profile.profession) or pkey == "software"
        if tech and not profile.is_filled("technologies") and not profile.is_filled("expertise_areas") and session.identity_depth < 3:
            return 0.45
        if pkey == "founder" and not profile.is_filled("current_professional_context"):
            return 0.3
        return 1.0
    if fields & {"technologies", "expertise_areas"}:
        if has_tech_context(profile.industries, profile.profession) and (
            profile.is_filled("specialty") or profile.is_filled("role")
        ):
            return 0.95
        return 0.5
    if "audience_problems" in fields:
        return 1.0 if profile.is_filled("primary_audience") else 0.0
    if fields & IDENTITY_FIELDS:
        if session.identity_depth >= 3:
            return 0.25
        return 0.95
    return 0.7


def _fatigue(q: AdaptiveQuestion, session: SessionState) -> float:
    if q.category in {"identity", "specialization"} and session.identity_depth >= 3:
        return 0.5
    if q.importance < 0.4 and session.questions_answered < 8:
        return 0.4
    return 0.0


def score_question(q: AdaptiveQuestion, profile: ContentDNA, session: SessionState) -> float:
    importance = q.importance
    for field in q.profileFieldsTargeted:
        importance = max(importance, DIMENSION_WEIGHTS.get(field, importance))
    utility = (
        importance
        * _uncertainty(profile, q.profileFieldsTargeted)
        * _relevance(q, profile, session)
        * 1.0
        - (q.estimatedEffort * 0.15)
        - _fatigue(q, session)
    )
    return utility


def filter_duplicates(
    candidates: List[AdaptiveQuestion], session: SessionState
) -> List[AdaptiveQuestion]:
    seen_ids = set(session.asked_ids)
    seen_titles = set(session.asked_titles_normalized)
    out: List[AdaptiveQuestion] = []
    for q in candidates:
        title_n = normalize_title(q.title)
        if q.id in seen_ids or title_n in seen_titles:
            continue
        if any(title_n == normalize_title(x.title) for x in out):
            continue
        out.append(q)
    return out


def rank_candidates(
    candidates: List[AdaptiveQuestion], profile: ContentDNA, session: SessionState
) -> List[Tuple[float, AdaptiveQuestion]]:
    unique = filter_duplicates(candidates, session)
    scored = [(score_question(q, profile, session), q) for q in unique]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [(s, q) for s, q in scored if s > 0]
