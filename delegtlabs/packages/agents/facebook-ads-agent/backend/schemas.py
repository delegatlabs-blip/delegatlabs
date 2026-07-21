from pydantic import BaseModel, Field


class FacebookAdsConfigSchema(BaseModel):
    monthly_budget_usd: float = 1000.0
    target_roas: float = 3.5
    target_countries: list[str] = Field(default_factory=lambda: ["US", "CA"])
    ad_copy_tone: str = "High Energy & Direct Response"
    retargeting_enabled: bool = True
