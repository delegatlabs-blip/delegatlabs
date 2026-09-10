from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.services.adaptive_onboarding.schema import QuestionOption

class TopicUpdateRequest(BaseModel):
    weight: Optional[float] = None
    is_active: Optional[bool] = None
    name: Optional[str] = None
    selected_option_value: Optional[str] = None

class TopicResponse(BaseModel):
    id: int
    name: str
    slug: str
    weight: float
    is_active: bool
    published_count: int = 0
    avg_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    persona_generated: bool
    selected_option_value: Optional[str] = None
    options: List[QuestionOption]

    class Config:
        from_attributes = True
