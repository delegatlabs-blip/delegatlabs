from pydantic import BaseModel, Field


class InstagramConfigSchema(BaseModel):
    content_pillars: list[str] = Field(default_factory=lambda: ["Reels & Shorts", "Product Showcases", "Behind The Scenes"])
    visual_style: str = "Aesthetic Minimalist"
    hashtag_count: int = 15
    auto_post_reels: bool = False
