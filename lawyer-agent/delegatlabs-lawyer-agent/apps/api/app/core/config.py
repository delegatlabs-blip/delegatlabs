from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DelegatLabs Lawyer Agent API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"

    frontend_origin: str = "http://localhost:3000"

    # AI Providers Keys
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    claude_api_key: Optional[str] = None
    ai_default_provider: str = "mock"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
