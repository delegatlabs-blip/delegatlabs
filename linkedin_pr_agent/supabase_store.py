import json
import os
from datetime import datetime, timezone


STORE_PATH = os.path.join(os.path.dirname(__file__), "linkedin_accounts.json")


def is_configured() -> bool:
    # Local JSON storage is always available for dev/testing.
    return True


def _load_store() -> dict:
    if not os.path.exists(STORE_PATH):
        return {"accounts": {}}
    with open(STORE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        return {"accounts": {}}
    data.setdefault("accounts", {})
    return data


def _save_store(data: dict):
    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=True)


def save_linkedin_account(
    account_id: str,
    access_token: str,
    expires_at: datetime,
    member_urn: str,
    scope: str,
    profile: dict,
):
    data = _load_store()
    data["accounts"][account_id] = {
        "account_id": account_id,
        "access_token": access_token,
        "expires_at": expires_at.isoformat(),
        "member_urn": member_urn,
        "scope": scope,
        "profile": profile or {},
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "reconsent_notified_at": None,
    }
    _save_store(data)


def get_linkedin_account(account_id: str) -> dict | None:
    data = _load_store()
    return data.get("accounts", {}).get(account_id)


def mark_linkedin_account_notified(account_id: str):
    data = _load_store()
    account = data.get("accounts", {}).get(account_id)
    if not account:
        return
    account["reconsent_notified_at"] = datetime.now(timezone.utc).isoformat()
    _save_store(data)
