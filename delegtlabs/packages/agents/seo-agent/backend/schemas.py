from pydantic import BaseModel, Field


class SEOConfigSchema(BaseModel):
    target_keywords: list[str] = Field(default_factory=lambda: ["AI agents platform", "B2B SaaS automation"])
    website_url: str = "https://acmesaas.com"
    target_search_engine: str = "Google US"
    target_article_length: int = 1800
    auto_publish_wordpress: bool = False
