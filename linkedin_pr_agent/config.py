import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(__file__)
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv()

def _sanitize(val: str) -> str:
    if val:
        # Replace non-breaking spaces and strip outer whitespaces
        return val.replace('\xa0', ' ').strip()
    return val

GEMINI_API_KEY = _sanitize(os.getenv("GEMINI_API_KEY"))
GROQ_API_KEY = _sanitize(os.getenv("GROQ_API_KEY"))
UNSPLASH_ACCESS_KEY = _sanitize(os.getenv("UNSPLASH_ACCESS_KEY"))
ANTHROPIC_API_KEY = _sanitize(os.getenv("ANTHROPIC_API_KEY"))
HUNTER_API_KEY = _sanitize(os.getenv("HUNTER_API_KEY"))
PROSPEO_API_KEY = _sanitize(os.getenv("PROSPEO_API_KEY"))
SNOV_CLIENT_ID = _sanitize(os.getenv("SNOV_CLIENT_ID"))
SNOV_CLIENT_SECRET = _sanitize(os.getenv("SNOV_CLIENT_SECRET"))

APP_BASE_URL = _sanitize(os.getenv("APP_BASE_URL", "http://localhost:8000"))
LINKEDIN_CLIENT_ID = _sanitize(os.getenv("LINKEDIN_CLIENT_ID"))
LINKEDIN_CLIENT_SECRET = _sanitize(os.getenv("LINKEDIN_CLIENT_SECRET"))
LINKEDIN_REDIRECT_URI = _sanitize(
    os.getenv("LINKEDIN_REDIRECT_URI", f"{APP_BASE_URL}/oauth/linkedin/callback")
)
LINKEDIN_OAUTH_SCOPES = _sanitize(
    os.getenv("LINKEDIN_OAUTH_SCOPES", "openid profile email w_member_social")
)
LINKEDIN_API_VERSION = _sanitize(os.getenv("LINKEDIN_API_VERSION", "202510"))
LINKEDIN_ACCOUNT_ID = _sanitize(os.getenv("LINKEDIN_ACCOUNT_ID", "local-user"))
LINKEDIN_ACCESS_TOKEN = _sanitize(os.getenv("LINKEDIN_ACCESS_TOKEN"))

SUPABASE_URL = _sanitize(os.getenv("SUPABASE_URL"))
SUPABASE_SERVICE_ROLE_KEY = _sanitize(os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
LINKEDIN_TOKEN_ENCRYPTION_KEY = _sanitize(os.getenv("LINKEDIN_TOKEN_ENCRYPTION_KEY"))
TOKEN_EXPIRY_WARNING_DAYS = int(os.getenv("TOKEN_EXPIRY_WARNING_DAYS", "7"))

GMAIL_ADDRESS = _sanitize(os.getenv("GMAIL_ADDRESS"))
GMAIL_APP_PASSWORD = _sanitize(os.getenv("GMAIL_APP_PASSWORD"))
NOTIFICATION_EMAIL = _sanitize(os.getenv("NOTIFICATION_EMAIL"))
HEADLESS = os.getenv("HEADLESS", "False").lower() == "true"
