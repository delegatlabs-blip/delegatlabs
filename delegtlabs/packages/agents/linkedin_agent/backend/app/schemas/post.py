from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.post import PostStatus

class GeneratePostRequest(BaseModel):
    topicId: Optional[int] = None
    sourceUrl: Optional[str] = None
    skipImage: bool = False

class ImprovePostRequest(BaseModel):
    title: str = ""
    description: str = ""
    tags: Optional[str] = None

class ImprovePostResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    ok: bool
    html: str
    plainText: str = Field(alias="plainText")

class PostUpdateRequest(BaseModel):
    generated_text: Optional[str] = None
    image_url: Optional[str] = None
    source_url: Optional[str] = None
    scheduled_at: Optional[str] = None

class RejectPostRequest(BaseModel):
    reason: Optional[str] = None

class PostResponse(BaseModel):
    id: int
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    topic_slug: Optional[str] = None
    source_url: Optional[str] = None
    prompt_text: Optional[str] = None
    generated_text: Optional[str] = None
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    linkedin_image_urn: Optional[str] = None
    status: PostStatus
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    linkedin_post_urn: Optional[str] = None
    rejection_reason: Optional[str] = None
    latest_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PostListResponse(BaseModel):
    posts: List[dict]
    total: int
    limit: int
    offset: int
