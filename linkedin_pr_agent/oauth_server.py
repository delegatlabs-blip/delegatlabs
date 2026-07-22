from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe
from urllib.parse import urlencode

import requests
from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse, RedirectResponse

import config
from supabase_store import is_configured, save_linkedin_account


app = FastAPI(title="LinkedIn Agent OAuth")
OAUTH_STATES: dict[str, dict] = {}
STATE_TTL_SECONDS = 600


def _missing_oauth_config() -> list[str]:
    required = {
        "LINKEDIN_CLIENT_ID": config.LINKEDIN_CLIENT_ID,
        "LINKEDIN_CLIENT_SECRET": config.LINKEDIN_CLIENT_SECRET,
        "LINKEDIN_REDIRECT_URI": config.LINKEDIN_REDIRECT_URI,
    }
    missing = [key for key, value in required.items() if not value]
    if not is_configured():
        missing.extend(
            key
            for key, value in {
                "SUPABASE_URL": config.SUPABASE_URL,
                "SUPABASE_SERVICE_ROLE_KEY": config.SUPABASE_SERVICE_ROLE_KEY,
                "LINKEDIN_TOKEN_ENCRYPTION_KEY": config.LINKEDIN_TOKEN_ENCRYPTION_KEY,
            }.items()
            if not value
        )
    return missing


@app.get("/", response_class=HTMLResponse)
@app.get("/dashboard", response_class=HTMLResponse)
def dashboard():
    missing = _missing_oauth_config()
    status = "Ready" if not missing else f"Missing: {', '.join(missing)}"
    account_id = config.LINKEDIN_ACCOUNT_ID
    return f"""
    <!doctype html>
    <html>
      <head><title>LinkedIn Agent Dashboard</title></head>
      <body style="font-family: system-ui; max-width: 720px; margin: 40px auto;">
        <h1>LinkedIn Agent Dashboard</h1>
        <p>Status: <strong>{status}</strong></p>
        <form action="/connect/linkedin" method="get">
          <label>Account ID <input name="account_id" value="{account_id}"></label>
          <button type="submit">Connect LinkedIn</button>
        </form>
        <form action="/agent/run" method="post" style="margin-top: 16px;">
          <button type="submit">Run Agent Once</button>
        </form>
        <p style="color:#666; font-size: 13px;">Runs immediately in background and starts creating a post now.</p>
      </body>
    </html>
    """


@app.get("/connect/linkedin")
def connect_linkedin(account_id: str | None = Query(default=None)):
    missing = _missing_oauth_config()
    if missing:
        raise HTTPException(status_code=500, detail=f"Missing config: {', '.join(missing)}")

    state = token_urlsafe(32)
    OAUTH_STATES[state] = {
        "account_id": account_id or config.LINKEDIN_ACCOUNT_ID,
        "created_at": datetime.now(timezone.utc),
    }
    params = {
        "response_type": "code",
        "client_id": config.LINKEDIN_CLIENT_ID,
        "redirect_uri": config.LINKEDIN_REDIRECT_URI,
        "state": state,
        "scope": config.LINKEDIN_OAUTH_SCOPES,
    }
    return RedirectResponse(
        f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(params)}"
    )


@app.get("/oauth/linkedin/callback", response_class=HTMLResponse)
def linkedin_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
):
    if error:
        raise HTTPException(status_code=400, detail=error_description or error)
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing OAuth code or state")

    saved_state = OAUTH_STATES.pop(state, None)
    if not saved_state:
        raise HTTPException(status_code=401, detail="Invalid OAuth state")
    state_age = datetime.now(timezone.utc) - saved_state["created_at"]
    if state_age.total_seconds() > STATE_TTL_SECONDS:
        raise HTTPException(status_code=401, detail="Expired OAuth state")

    token_res = requests.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "client_id": config.LINKEDIN_CLIENT_ID,
            "client_secret": config.LINKEDIN_CLIENT_SECRET,
            "redirect_uri": config.LINKEDIN_REDIRECT_URI,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    if token_res.status_code >= 400:
        raise HTTPException(
            status_code=token_res.status_code,
            detail=f"LinkedIn token exchange failed: {token_res.text}",
        )
    token_data = token_res.json()
    access_token = token_data["access_token"]

    userinfo_res = requests.get(
        "https://api.linkedin.com/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=30,
    )
    if userinfo_res.status_code >= 400:
        raise HTTPException(
            status_code=userinfo_res.status_code,
            detail=f"LinkedIn userinfo failed: {userinfo_res.text}",
        )
    profile = userinfo_res.json()
    subject = profile.get("sub")
    if not subject:
        raise HTTPException(status_code=502, detail="LinkedIn userinfo did not return sub")

    expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=int(token_data.get("expires_in", 5_184_000))
    )
    member_urn = subject if subject.startswith("urn:li:") else f"urn:li:person:{subject}"
    account_id = saved_state["account_id"]

    save_linkedin_account(
        account_id=account_id,
        access_token=access_token,
        expires_at=expires_at,
        member_urn=member_urn,
        scope=token_data.get("scope", config.LINKEDIN_OAUTH_SCOPES),
        profile=profile,
    )
    return f"""
    <h1>LinkedIn connected</h1>
    <p>Stored token for <strong>{account_id}</strong>.</p>
    <p>Member URN: <code>{member_urn}</code></p>
    <p>Expires at: <code>{expires_at.isoformat()}</code></p>
    <p><a href="/dashboard">Back to dashboard</a></p>
    """


@app.post("/agent/run")
def run_agent(background_tasks: BackgroundTasks, topic: str | None = None):
    from main import job

    background_tasks.add_task(job, topic)
    selected = topic or "dynamic"
    return {
        "status": "started",
        "message": f"Agent started immediately for topic: {selected}",
        "topic": selected,
    }


@app.post("/token/check")
def check_token(account_id: str | None = None):
    from linkedin_api import check_linkedin_token_expiry

    check_linkedin_token_expiry(account_id)
    return {"status": "checked", "account_id": account_id or config.LINKEDIN_ACCOUNT_ID}
