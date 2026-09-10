from typing import Optional, List, Any, Dict
from pydantic import BaseModel

class OnboardingAnswers(BaseModel):
    targetAudience: Optional[str] = None
    contentGoal: Optional[str] = None
    contentFormats: Optional[List[str]] = None
    opinionStyle: Optional[str] = None
    trendingNews: Optional[str] = None
    ctaUsage: Optional[str] = None
    emojiUsage: Optional[str] = None
    styleReference: Optional[str] = None
    industries: Optional[List[str]] = None
    tone: Optional[str] = None
    postLength: Optional[str] = None
    topicsOfInterest: Optional[List[str]] = None

    class Config:
        extra = "allow"

class OnboardingResponse(BaseModel):
    ok: bool = True
    post: Optional[Any] = None
    answers: Dict[str, Any]
