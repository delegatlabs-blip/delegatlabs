from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class LawyerAgentConfigSchema(BaseModel):
    jurisdiction: str = "Uttar Pradesh"
    ui_language: str = "en"
    draft_language: str = "en"
    ai_provider: str = "mock"
    firm_name: str = ""


class DraftGenerationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    draft_id: str = Field(..., alias="draftId")
    draft_title: str = Field(..., alias="draftTitle")
    draft_language: str = Field(..., alias="draftLanguage")
    jurisdiction: str
    system_instruction: str = Field(..., alias="systemInstruction")
    user_instruction: str = Field(..., alias="userInstruction")
    structured_facts: dict[str, Any] = Field(..., alias="structuredFacts")
    selected_clauses: list[dict[str, Any]] = Field(default_factory=list, alias="selectedClauses")
    guardrails: list[str] = Field(default_factory=list)
    output_requirements: list[str] = Field(default_factory=list, alias="outputRequirements")
    validation_summary: str = Field("", alias="validationSummary")
    custom_instructions: Optional[str] = Field(None, alias="customInstructions")


class DraftGenerationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    draft_id: str = Field(..., alias="draftId")
    provider: str
    model: str
    status: str
    draft_text: str = Field(..., alias="draftText")
    warnings: list[str]
    generation_id: str = Field(..., alias="generationId")


class AgentRunSchema(BaseModel):
    id: str
    run_type: str
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    output_summary: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None


class DailyMetricSchema(BaseModel):
    date: str
    drafts_generated: float


class LawyerAdminStatsResponse(BaseModel):
    active_customers: int
    mrr_attributed: float
    error_rate_7d: float
    recent_runs: list[AgentRunSchema]
    daily_metrics_30d: list[DailyMetricSchema]
