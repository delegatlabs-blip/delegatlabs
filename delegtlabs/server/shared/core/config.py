from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application and API versioning live here so every surface shares one source of truth."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "DelegtLabs"
    app_env: str = "development"
    app_version: str = "0.1.0"
    api_version: str = "v1"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    cors_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5173,http://localhost:8080,http://localhost:8081"

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/delegtlabs"
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 30
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""
    supabase_jwks_url: str = "https://project-id.supabase.co/auth/v1/.well-known/jwks.json"
    supabase_jwt_issuer: str = "https://project-id.supabase.co/auth/v1"
    supabase_jwt_audience: str = "authenticated"
    admin_required_role: str = "ops_admin"
    # Auth skipped for now while wiring frontend APIs
    disable_admin_auth: bool = True

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def api_prefix(self) -> str:
        """Base prefix for versioned HTTP APIs, e.g. /api/v1."""
        return f"/api/{self.api_version}"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
