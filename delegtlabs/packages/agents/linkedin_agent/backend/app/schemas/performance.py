from typing import Optional
from pydantic import BaseModel

class ManualEngagementRequest(BaseModel):
    postId: int
    likes: int = 0
    comments: int = 0
    shares: int = 0
    impressions: Optional[int] = 0
