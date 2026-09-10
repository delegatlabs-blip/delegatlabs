from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from app.api.deps import require_auth
from app.core.database import execute_raw

router = APIRouter(prefix="/settings", tags=["settings"], dependencies=[Depends(require_auth)])

ALLOWED_KEYS = {
    "auto_publish_enabled",
    "posts_per_week",
    "default_tone",
    "post_length",
    "hashtag_count",
    "publish_cron_interval",
    "feedback_cron_hour",
    "linkedin_version",
    "token_expiry_warn_days",
}

@router.get("")
async def get_settings():
    sql = "SELECT key, value, description FROM settings ORDER BY key"
    rows = await execute_raw(sql)
    settings = {r["key"]: {"value": r["value"], "description": r["description"]} for r in rows}
    return settings

@router.patch("")
async def update_settings(request: Request):
    try:
        updates: Dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid settings JSON body")

    valid_entries = [(k, str(v)) for k, v in updates.items() if k in ALLOWED_KEYS]
    if not valid_entries:
        raise HTTPException(status_code=400, detail="No valid settings keys provided")

    results = {}
    for key, value in valid_entries:
        sql = """
        INSERT INTO settings (key, value, updated_at)
        VALUES (:key, :value, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        """
        await execute_raw(sql, {"key": key, "value": value})
        results[key] = value

    return {"ok": True, "updated": results}
