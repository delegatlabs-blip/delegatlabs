from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class LinkedInLeadConfig(BaseModel):
    target_job_titles: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)
    company_size: list[str] = Field(default_factory=list)
    geography: list[str] = Field(default_factory=lambda: ["United States", "India"])
    score_threshold: int = 70
    connection_message_template: str = ""
    daily_connection_cap: int = 20


class LinkedInPostConfig(BaseModel):
    content_pillars: list[str] = Field(default_factory=list)
    topic_weights: dict[str, float] = Field(
        default_factory=lambda: {
            "product_updates": 0.3,
            "industry_news": 0.35,
            "thought_leadership": 0.35,
        }
    )
    news_sources: list[str] = Field(
        default_factory=lambda: [
            "https://techcrunch.com/feed/",
            "https://www.theverge.com/rss/index.xml",
        ]
    )
    tone: str = "Professional"
    posting_frequency: str = "3x_per_week"
    approval_mode: str = "review_first"


class LinkedInAgentConfigSchema(BaseModel):
    lead_gen: LinkedInLeadConfig = Field(default_factory=LinkedInLeadConfig)
    post_gen: LinkedInPostConfig = Field(default_factory=LinkedInPostConfig)


class AgentRunSchema(BaseModel):
    id: str
    client_agent_id: Optional[str] = None
    run_type: str
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    output_summary: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None


class DailyMetricSchema(BaseModel):
    date: str
    leads_generated: float
    posts_published: float


class LinkedInAdminStatsResponse(BaseModel):
    active_customers: int
    mrr_attributed: float
    runs_24h: int
    runs_30d: int
    error_rate_7d: float
    subscribers: list[dict[str, Any]]
    lead_pipeline: dict[str, Any]
    credential_health: list[dict[str, Any]]
    recent_runs: list[AgentRunSchema]
    daily_metrics_30d: list[DailyMetricSchema]
