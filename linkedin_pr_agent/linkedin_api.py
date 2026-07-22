from datetime import datetime, timedelta, timezone

import requests

import config
from memory_manager import load_memory, save_memory
from supabase_store import (
    get_linkedin_account,
    is_configured as supabase_is_configured,
    mark_linkedin_account_notified,
)


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _connect_url(account_id: str) -> str:
    return f"{config.APP_BASE_URL.rstrip('/')}/connect/linkedin?account_id={account_id}"


def _legacy_token_expiry_check():
    token = config.LINKEDIN_ACCESS_TOKEN
    if not token or "test_access_token" in token:
        return

    data = load_memory()
    last_token = data.get("linkedin_last_access_token")
    token_created_at = data.get("linkedin_token_created_at")
    current_time = datetime.now()

    if last_token != token or not token_created_at:
        data["linkedin_last_access_token"] = token
        data["linkedin_token_created_at"] = current_time.isoformat()
        save_memory(data)
        token_created_at = current_time.isoformat()
        print("Detected new/updated LINKEDIN_ACCESS_TOKEN. Resetting creation timestamp.")

    try:
        created_dt = datetime.fromisoformat(token_created_at)
        days_elapsed = (current_time - created_dt).days
        print(f"LinkedIn Access Token age: {days_elapsed} days.")
        if days_elapsed >= 60 - config.TOKEN_EXPIRY_WARNING_DAYS:
            from notifier import send_notification

            days_left = max(0, 60 - days_elapsed)
            send_notification(
                "LinkedIn PR Agent: Access Token Expiry Warning",
                (
                    f"Your LinkedIn Access Token was created/updated on "
                    f"{created_dt.strftime('%Y-%m-%d')} ({days_elapsed} days ago).\n"
                    f"It is estimated to expire in {days_left} days.\n"
                    "Please reconnect LinkedIn from the dashboard."
                ),
            )
    except Exception as e:
        print(f"Error checking token expiry: {e}")


def check_linkedin_token_expiry(account_id: str | None = None):
    """Checks whether the stored LinkedIn OAuth token needs re-consent soon."""
    if not supabase_is_configured():
        _legacy_token_expiry_check()
        return

    account_id = account_id or config.LINKEDIN_ACCOUNT_ID
    try:
        account = get_linkedin_account(account_id)
    except Exception as e:
        print(f"Could not check LinkedIn token expiry from Supabase: {e}")
        return
    if not account:
        print(f"No LinkedIn OAuth account stored for account_id={account_id}.")
        return

    expires_at = _parse_datetime(account.get("expires_at"))
    if not expires_at:
        print(f"LinkedIn account {account_id} has no valid expires_at timestamp.")
        return

    now = datetime.now(timezone.utc)
    remaining = expires_at - now
    print(f"LinkedIn OAuth token for {account_id} expires in {remaining.days} days.")
    if remaining > timedelta(days=config.TOKEN_EXPIRY_WARNING_DAYS):
        return

    last_notified = _parse_datetime(account.get("reconsent_notified_at"))
    if last_notified and now - last_notified < timedelta(days=1):
        return

    from notifier import send_notification

    send_notification(
        "LinkedIn Agent: Reconnect LinkedIn",
        (
            f"Your LinkedIn OAuth token for {account_id} expires at "
            f"{expires_at.isoformat()}.\n\n"
            f"Reconnect here: {_connect_url(account_id)}"
        ),
    )
    try:
        mark_linkedin_account_notified(account_id)
    except Exception as e:
        print(f"Could not mark LinkedIn re-consent notification sent: {e}")


def _get_person_urn(access_token: str | None = None) -> str:
    """Retrieves the person URN of the authenticated member."""
    token = access_token or config.LINKEDIN_ACCESS_TOKEN
    if not token:
        print("LinkedIn access token is missing.")
        return ""

    try:
        res = requests.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        res.raise_for_status()
        person_id = res.json().get("sub")
        if person_id:
            return person_id if person_id.startswith("urn:li:") else f"urn:li:person:{person_id}"
    except Exception as e:
        print(f"Error fetching LinkedIn userinfo URN: {e}")
        if "res" in locals():
            print(f"Raw userinfo response: {res.text}")
    return ""


def _get_post_credentials(account_id: str | None = None) -> tuple[str, str]:
    if supabase_is_configured():
        account_id = account_id or config.LINKEDIN_ACCOUNT_ID
        account = get_linkedin_account(account_id)
        if not account:
            print(f"No LinkedIn OAuth account stored for account_id={account_id}.")
            return "", ""
        return account.get("access_token", ""), account.get("member_urn", "")

    token = config.LINKEDIN_ACCESS_TOKEN or ""
    return token, _get_person_urn(token)


def _post_id_from_response(res) -> str:
    restli_id = res.headers.get("x-restli-id") if hasattr(res, "headers") else None
    if isinstance(restli_id, str) and restli_id:
        return restli_id
    try:
        post_id = res.json().get("id")
        return post_id if isinstance(post_id, str) else ""
    except Exception:
        return ""


def post_to_linkedin(
    content: str,
    image_path: str | None = None,
    account_id: str | None = None,
) -> tuple[str, str]:
    """
    Publishes a text post through LinkedIn's /rest/posts API.
    Returns (post_urn, asset_urn). asset_urn is empty because this flow is text-only.
    """
    check_linkedin_token_expiry(account_id)

    access_token, member_urn = _get_post_credentials(account_id)
    if not access_token or not member_urn:
        print("Failed to load LinkedIn access token/member URN. Skipping post.")
        return "", ""

    if image_path:
        print("Image upload is not wired to /rest/posts yet. Publishing text-only.")

    payload = {
        "author": member_urn,
        "commentary": content,
        "visibility": "PUBLIC",
        "distribution": {
            "feedDistribution": "MAIN_FEED",
            "targetEntities": [],
            "thirdPartyDistributionChannels": [],
        },
        "lifecycleState": "PUBLISHED",
        "isReshareDisabledByAuthor": False,
    }
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Linkedin-Version": config.LINKEDIN_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
    }

    try:
        print("Publishing post via LinkedIn /rest/posts API...")
        res = requests.post(
            "https://api.linkedin.com/rest/posts",
            headers=headers,
            json=payload,
            timeout=30,
        )
        res.raise_for_status()
        post_urn = _post_id_from_response(res)
        if post_urn:
            print(f"Post published successfully via API. URN: {post_urn}")
            return post_urn, ""
        print("LinkedIn returned success but no post URN was found in the response.")
    except Exception as e:
        print(f"Error posting to LinkedIn via API: {e}")
        if "res" in locals():
            print(f"Raw response: {res.text}")

    return "", ""
