from typing import Optional, Dict
from pydantic import BaseModel

class SettingItem(BaseModel):
    value: str
    description: Optional[str] = None

class SettingsUpdateRequest(BaseModel):
    auto_publish_enabled: Optional[str] = None
    posts_per_week: Optional[str] = None
    default_tone: Optional[str] = None
    post_length: Optional[str] = None
    hashtag_count: Optional[str] = None
    publish_cron_interval: Optional[str] = None
    feedback_cron_hour: Optional[str] = None
    linkedin_version: Optional[str] = None
    token_expiry_warn_days: Optional[str] = None

    class Config:
        extra = "allow"
