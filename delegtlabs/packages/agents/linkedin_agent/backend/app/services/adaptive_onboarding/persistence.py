"""Load and save Content DNA per tenant."""
from __future__ import annotations

import json
from typing import Any, Dict, Optional, Tuple

from app.core.database import execute_one_raw, execute_raw
from app.services.adaptive_onboarding.legacy import legacy_to_dna
from app.services.adaptive_onboarding.question_bank import (
    coerce_selectable_current,
    first_question,
)
from app.services.adaptive_onboarding.schema import ContentDNA, SessionState


def _parse_json(value: Any) -> Any:
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return {}
    return {}


async def load_legacy_answers(tenant_id: str) -> Optional[Dict[str, Any]]:
    rows = await execute_raw(
        "SELECT question_id, value FROM onboarding_answers WHERE tenant_id = :tid",
        {"tid": tenant_id},
    )
    if rows:
        answers: Dict[str, Any] = {}
        for r in rows:
            val = r["value"]
            if isinstance(val, str):
                try:
                    val = json.loads(val)
                except Exception:
                    pass
            answers[r["question_id"]] = val
        return answers
    row = await execute_one_raw("SELECT value FROM settings WHERE key = 'onboarding_answers'")
    if not row:
        return None
    try:
        parsed = json.loads(row["value"]) if isinstance(row["value"], str) else row["value"]
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


async def load_state(tenant_id: str) -> Optional[Tuple[ContentDNA, SessionState]]:
    row = await execute_one_raw(
        "SELECT profile, session FROM content_dna WHERE tenant_id = :tid",
        {"tid": tenant_id},
    )
    if not row:
        return None
    profile = ContentDNA.model_validate(_parse_json(row["profile"]))
    session = SessionState.model_validate(_parse_json(row["session"]))
    return profile, session


async def save_state(
    tenant_id: str,
    profile: ContentDNA,
    session: SessionState,
    updated_by: Optional[str],
) -> None:
    await execute_one_raw(
        """
        INSERT INTO content_dna (tenant_id, profile, session, onboarding_version, updated_by, updated_at)
        VALUES (:tid, CAST(:profile AS jsonb), CAST(:session AS jsonb), :ver, :by, NOW())
        ON CONFLICT (tenant_id) DO UPDATE SET
          profile = EXCLUDED.profile,
          session = EXCLUDED.session,
          onboarding_version = EXCLUDED.onboarding_version,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
        RETURNING tenant_id
        """,
        {
            "tid": tenant_id,
            "profile": profile.model_dump_json(),
            "session": session.model_dump_json(),
            "ver": profile.onboarding_version,
            "by": updated_by,
        },
    )


async def get_or_migrate(tenant_id: str) -> Tuple[ContentDNA, SessionState]:
    existing = await load_state(tenant_id)
    if existing:
        profile, session = existing
        coerce_selectable_current(profile, session)
        if session.current_question is None and session.status != "completed":
            session.current_question = first_question()
        return profile, session
    legacy = await load_legacy_answers(tenant_id)
    if legacy:
        profile, session = legacy_to_dna(legacy)
        await save_state(tenant_id, profile, session, updated_by=None)
        return profile, session
    profile = ContentDNA()
    session = SessionState(current_question=first_question())
    return profile, session


async def delete_state(tenant_id: str) -> None:
    await execute_raw("DELETE FROM content_dna WHERE tenant_id = :tid", {"tid": tenant_id})
