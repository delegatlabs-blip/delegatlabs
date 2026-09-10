from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_TOKEN_ENC_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
DEFAULT_JWT_SECRET = "antgrav-default-admin-jwt-secret-key-32-chars-minimum"

class Settings(BaseSettings):
    # LinkedIn OAuth
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    LINKEDIN_REDIRECT_URI: str = "http://localhost:8005/auth/linkedin/callback"
    # Marketing API version header (YYYYMM). 202502 is sunset — use a currently supported month.
    LINKEDIN_API_VERSION: str = "202608"
    # Space-delimited OAuth scopes. Default is personal-only — LinkedIn rejects the
    # authorize request if you ask for a scope the Developer App has not been granted.
    # After Community Management / w_organization_social is approved on the app, set:
    #   LINKEDIN_OAUTH_SCOPES=openid profile email w_member_social w_organization_social
    LINKEDIN_OAUTH_SCOPES: str = "openid profile email w_member_social"

    # AI APIs
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash-lite"
    GEMINI_FALLBACK_MODEL: str = "gemini-2.0-flash"
    GROK_API_KEY: str = ""
    GROK_IMAGE_MODEL: str = "grok-2-image"

    # Adaptive onboarding (TS-12). User-authorized defaults.
    ONBOARDING_MIN_QUESTIONS: int = 6
    ONBOARDING_MAX_QUESTIONS: int = 14
    ONBOARDING_TARGET_COVERAGE: float = 0.80

    # Database
    DATABASE_URL: str = "postgresql://somyabhardwaj@localhost:5432/linkedin_agent"

    # Security
    TOKEN_ENC_KEY: str = DEFAULT_TOKEN_ENC_KEY
    ADMIN_JWT_SECRET: str = DEFAULT_JWT_SECRET
    ADMIN_PASSWORD: str = "changeme123"

    # User sessions (email/LinkedIn sign-in). Falls back to ADMIN_JWT_SECRET when unset
    # so an existing deployment keeps working without a new secret; set it separately in
    # production so revoking staff access does not invalidate every customer session.
    USER_JWT_SECRET: str = ""
    SESSION_TTL_DAYS: int = 7
    SESSION_COOKIE_NAME: str = "antgrav_session"

    # Email OTP
    OTP_LENGTH: int = 6
    OTP_TTL_SECONDS: int = 600
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    # Max OTP requests per email address per hour, and per source IP per hour.
    OTP_MAX_PER_EMAIL_HOUR: int = 5
    OTP_MAX_PER_IP_HOUR: int = 20
    # Extra secret mixed into the OTP hash. Falls back to ADMIN_JWT_SECRET when unset.
    OTP_HASH_PEPPER: str = ""
    # When true, the fixed code below is accepted in addition to the real generated one,
    # and codes are logged instead of emailed. MUST be false in production.
    OTP_DEV_MODE: bool = False
    OTP_DEV_CODE: str = "123456"

    # SMTP — when SMTP_HOST is empty the mailer logs to stdout instead of sending.
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "no-reply@antgrav.local"
    SMTP_FROM_NAME: str = "AntGrav"
    SMTP_STARTTLS: bool = True
    SMTP_TIMEOUT_SECONDS: int = 15

    # Escape hatch that restores the pre-007 behaviour of auto-issuing a session to any
    # caller without one. Defaults to false so the sign-in flow is what you actually hit.
    DEV_AUTH_BYPASS: bool = False

    # Razorpay one-time Orders (INR). Leave blank to disable checkout.
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # Server
    PORT: int = 8005
    # Defaults to "production" so any deployment that forgets to set this explicitly
    # fails secure (real auth required) instead of silently auto-granting admin access.
    # Local dev opts in via NODE_ENV=development in .env.
    NODE_ENV: str = "production"
    FRONTEND_URL: str = "http://localhost:3005"
    BACKEND_URL: str = "http://localhost:8005"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("TOKEN_ENC_KEY", mode="before")
    @classmethod
    def validate_enc_key(cls, val: str) -> str:
        if not val or len(str(val)) != 64:
            return DEFAULT_TOKEN_ENC_KEY
        return str(val)

    @field_validator("ADMIN_JWT_SECRET", mode="before")
    @classmethod
    def validate_jwt_secret(cls, val: str) -> str:
        if not val or len(str(val)) < 32:
            return DEFAULT_JWT_SECRET
        return str(val)

    @property
    def async_database_url(self) -> str:
        """Converts postgresql:// or postgres:// to postgresql+asyncpg:// for SQLAlchemy async driver."""
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    @property
    def sync_database_url(self) -> str:
        """Converts postgresql+asyncpg:// back to postgresql:// for sync operations/migrations if needed."""
        url = self.DATABASE_URL
        if url.startswith("postgresql+asyncpg://"):
            return url.replace("postgresql+asyncpg://", "postgresql://", 1)
        return url

    @property
    def user_jwt_secret(self) -> str:
        """Dedicated user-session secret, falling back to the admin secret."""
        return self.USER_JWT_SECRET or self.ADMIN_JWT_SECRET

    @property
    def otp_pepper(self) -> str:
        """Pepper mixed into OTP hashes, falling back to the admin secret."""
        return self.OTP_HASH_PEPPER or self.ADMIN_JWT_SECRET

    @property
    def is_development(self) -> bool:
        return self.NODE_ENV == "development"

    @property
    def razorpay_configured(self) -> bool:
        return bool(self.RAZORPAY_KEY_ID and self.RAZORPAY_KEY_SECRET)


settings = Settings()
