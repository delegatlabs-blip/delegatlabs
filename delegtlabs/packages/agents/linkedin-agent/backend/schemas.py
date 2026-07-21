from datetime import datetime, date
from typing import Any, Optional
from pydantic import BaseModel, Field


class LinkedInLeadConfig(BaseModel):
    target_job_titles: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)
    company_size: list[str] = Field(default_factory=list)
    connection_message_template: str = ""
    daily_connection_cap: int = 20


class LinkedInPostConfig(BaseModel):
    content_pillars: list[str] = Field(default_factory=list)
    tone: str = "Professional"
    posting_frequency: str = "3x_per_week"
    approval_mode: str = "review_first"  # auto_publish vs review_first


class LinkedInAgentConfigSchema(BaseModel):
    lead_gen: LinkedInLeadConfig = Field(default_factory=LinkedInLeadConfig)
    post_gen: LinkedInPostConfig = Field(default_factory=LinkedInPostConfig)


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
    leads_generated: float
    posts_published: float


class LinkedInAdminStatsResponse(BaseModel):
    active_customers: int
    mrr_attributed: float
    error_rate_7d: float
    recent_runs: list[AgentRunSchema]
    daily_metrics_30d: list[DailyMetricSchema]
