from typing import Optional
from pydantic import BaseModel, Field


class LinkedInPostConfig(BaseModel):
    content_pillars: list[str] = Field(
        default_factory=lambda: ["Industry Insights", "Product Updates", "Thought Leadership"]
    )
    topic_weights: dict[str, float] = Field(
        default_factory=lambda: {
            "product_updates": 0.30,
            "industry_news": 0.35,
            "thought_leadership": 0.35,
        }
    )
    tone: str = "professional"
    posting_frequency: str = "3x_week"
    approval_required: bool = True
    post_length: str = "medium"
    hashtag_count: int = 4
    auto_publish_enabled: bool = False


class LinkedInLeadConfig(BaseModel):
    target_job_titles: list[str] = Field(default_factory=list)
    target_industries: list[str] = Field(default_factory=list)
    company_size_range: str = "11-200"
    geography_filter: str = ""
    min_lead_score: int = 70
    message_template: str = ""
    daily_connection_cap: int = 20


class LinkedInAgentConfig(BaseModel):
    post_config: LinkedInPostConfig = Field(default_factory=LinkedInPostConfig)
    lead_config: LinkedInLeadConfig = Field(default_factory=LinkedInLeadConfig)


class GeneratePostRequest(BaseModel):
    topic_id: Optional[int] = None
    source_url: Optional[str] = None


class AdminStatsResponse(BaseModel):
    active_customers: int
    mrr_attributed: float
    runs_24h: int
    runs_30d: int
    error_rate_7d: float
    posts_published_30d: int
    posts_pending_approval: int
    daily_posts_30d: list[dict]
    recent_runs: list[dict]
    subscribers: list[dict]
