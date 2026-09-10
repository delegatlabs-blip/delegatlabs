"""Pydantic models for adaptive onboarding and Content DNA."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator

QuestionType = Literal[
    "single_select",
    "multi_select",
    "short_text",
    "long_text",
    "scale",
    "ranking",
]
GeneratedBy = Literal["system", "ai"]
FieldSource = Literal["answer", "ai", "inferred", "legacy"]
SessionStatus = Literal["in_progress", "completed"]


class QuestionOption(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    value: str
    label: str
    description: Optional[str] = None


class AdaptiveQuestion(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    category: str
    profileFieldsTargeted: List[str]
    title: str
    description: Optional[str] = None
    type: QuestionType
    options: Optional[List[QuestionOption]] = None
    allowOther: bool = False
    otherPlaceholder: Optional[str] = None
    required: bool = True
    importance: float = 0.5
    estimatedEffort: float = 0.3
    dependsOn: Optional[Dict[str, Any]] = None
    generatedBy: GeneratedBy = "system"
    metadata: Optional[Dict[str, Any]] = None

    @field_validator("importance", "estimatedEffort")
    @classmethod
    def _unit_interval(cls, v: float) -> float:
        if v < 0 or v > 1:
            raise ValueError("must be between 0 and 1")
        return v

    @field_validator("title")
    @classmethod
    def _title_nonempty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("title is required")
        return v.strip()


class FieldMeta(BaseModel):
    confidence: float = 1.0
    source: FieldSource = "answer"
    question_id: Optional[str] = None


class RawAnswer(BaseModel):
    question_id: str
    value: Any
    answered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    answer_method: Literal["predefined", "custom", "mixed"] = "predefined"


class ContentDNA(BaseModel):
    """Normalized profile. Raw user text is in raw_answers, never discarded."""

    primary_domain: Optional[str] = None
    profession: Optional[str] = None
    role: Optional[str] = None
    specialty: Optional[str] = None
    sub_specialties: List[str] = Field(default_factory=list)
    seniority: Optional[str] = None
    years_experience: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    expertise_areas: List[str] = Field(default_factory=list)
    industries: List[str] = Field(default_factory=list)
    current_professional_context: Optional[str] = None

    primary_audience: List[str] = Field(default_factory=list)
    audience_roles: List[str] = Field(default_factory=list)
    audience_seniority: Optional[str] = None
    audience_industries: List[str] = Field(default_factory=list)
    audience_problems: List[str] = Field(default_factory=list)
    audience_aspirations: List[str] = Field(default_factory=list)
    audience_knowledge_level: Optional[str] = None

    primary_goal: List[str] = Field(default_factory=list)

    content_pillars: List[str] = Field(default_factory=list)
    preferred_topics: List[str] = Field(default_factory=list)
    avoided_topics: List[str] = Field(default_factory=list)
    emerging_topics: List[str] = Field(default_factory=list)
    news_interest: Optional[str] = None
    topic_depth: Optional[str] = None

    experiences: List[str] = Field(default_factory=list)
    strong_opinions: List[str] = Field(default_factory=list)
    beliefs: List[str] = Field(default_factory=list)
    topics_user_can_speak_authoritatively_about: List[str] = Field(default_factory=list)

    tone: List[str] = Field(default_factory=list)
    opinion_strength: Optional[str] = None
    emoji_preference: Optional[str] = None
    hashtag_preference: Optional[str] = None

    preferred_formats: List[str] = Field(default_factory=list)
    preferred_length: Optional[str] = None
    hook_style: Optional[str] = None
    cta_style: Optional[str] = None

    prohibited_topics: List[str] = Field(default_factory=list)
    confidentiality_rules: List[str] = Field(default_factory=list)
    claims_to_avoid: List[str] = Field(default_factory=list)

    creators_user_likes: List[str] = Field(default_factory=list)
    writing_samples: List[str] = Field(default_factory=list)

    profile_coverage: float = 0.0
    onboarding_version: str = "adaptive-1"
    field_meta: Dict[str, FieldMeta] = Field(default_factory=dict)
    raw_answers: List[RawAnswer] = Field(default_factory=list)
    last_updated_at: Optional[datetime] = None

    def is_filled(self, field: str) -> bool:
        val = getattr(self, field, None)
        if val is None:
            return False
        if isinstance(val, list):
            return len(val) > 0
        if isinstance(val, str):
            return bool(val.strip())
        return True

    def set_field(
        self,
        field: str,
        value: Any,
        *,
        source: FieldSource,
        confidence: float,
        question_id: Optional[str],
    ) -> None:
        if field in {
            "field_meta",
            "raw_answers",
            "profile_coverage",
            "onboarding_version",
            "last_updated_at",
        } or not hasattr(self, field):
            return
        current = getattr(self, field)
        if isinstance(current, list):
            incoming = value if isinstance(value, list) else [value]
            merged = list(
                dict.fromkeys(
                    [*current, *[str(v).strip() for v in incoming if v is not None and str(v).strip()]]
                )
            )
            setattr(self, field, merged)
        else:
            setattr(self, field, value)
        self.field_meta[field] = FieldMeta(
            confidence=confidence, source=source, question_id=question_id
        )
        self.last_updated_at = datetime.now(timezone.utc)

    def clear_fields(self, fields: List[str]) -> None:
        for field in fields:
            if field in ("field_meta", "raw_answers") or not hasattr(self, field):
                continue
            current = getattr(self, field)
            if isinstance(current, list):
                setattr(self, field, [])
            else:
                setattr(self, field, None)
            self.field_meta.pop(field, None)


class HistoryEntry(BaseModel):
    question: AdaptiveQuestion
    raw_answer: Any
    fields_written: List[str] = Field(default_factory=list)
    answer_method: Literal["predefined", "custom", "mixed"] = "predefined"


class SessionState(BaseModel):
    status: SessionStatus = "in_progress"
    history: List[HistoryEntry] = Field(default_factory=list)
    current_question: Optional[AdaptiveQuestion] = None
    asked_ids: List[str] = Field(default_factory=list)
    asked_titles_normalized: List[str] = Field(default_factory=list)
    identity_depth: int = 0
    questions_answered: int = 0
    coverage: float = 0.0
    last_ai_used: bool = False
    last_latency_ms: Optional[int] = None
    # Set by POST /adaptive/complete (Finish). Cleared when the session is reset.
    finish_acknowledged: bool = False


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    field: str
    value: Any
    confidence: float = 0.7
    source: FieldSource = "ai"


class PlannerCandidate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    category: str
    profileFieldsTargeted: List[str]
    title: str
    description: Optional[str] = None
    type: QuestionType = "single_select"
    options: Optional[List[QuestionOption]] = None
    allowOther: bool = True
    otherPlaceholder: Optional[str] = None
    importance: float = 0.6
    estimatedEffort: float = 0.3
    required: bool = True
    reason: Optional[str] = None


class PlannerOutput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    profileUpdates: List[ProfileUpdate] = Field(default_factory=list)
    candidateQuestions: List[PlannerCandidate] = Field(default_factory=list)


AnswerValue = Union[str, List[str], int, float, None]


class EngineResult(BaseModel):
    profile: ContentDNA
    session: SessionState
    question: Optional[AdaptiveQuestion] = None
    complete: bool = False
    fallback_used: bool = False
    ai_used: bool = False
    latency_ms: int = 0
