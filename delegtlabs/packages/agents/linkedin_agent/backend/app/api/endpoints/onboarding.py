import json
import re
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from app.api.deps import require_auth
from app.api.auth_context import AuthContext, get_auth_context
from app.core.database import execute_raw, execute_one_raw
from app.services.audit import DEFAULT_TENANT_ID

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/onboarding", tags=["onboarding"], dependencies=[Depends(require_auth)])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

@router.get("")
async def get_onboarding(ctx: AuthContext = Depends(get_auth_context)):
    from app.api.endpoints.onboarding_adaptive import load_onboarding_payload

    try:
        return await load_onboarding_payload(ctx)
    except Exception as exc:
        msg = str(exc).lower()
        if "content_dna" not in msg and "does not exist" not in msg:
            raise
        logger.exception("[Onboarding] adaptive GET failed; using legacy answers")
    # Prefer per-question rows (resumable); fall back to legacy settings blob
    rows = await execute_raw(
        "SELECT question_id, value FROM onboarding_answers WHERE tenant_id = :tid",
        {"tid": ctx.tenant_id},
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
        answered_ids = [r["question_id"] for r in rows]
        return {"answers": answers, "answered_ids": answered_ids, "resume_from_index": None}

    sql = "SELECT value FROM settings WHERE key = 'onboarding_answers'"
    row = await execute_one_raw(sql)
    if not row:
        return {"answers": None, "answered_ids": [], "resume_from_index": 0}
    try:
        answers = json.loads(row["value"])
        return {"answers": answers, "answered_ids": list(answers.keys()), "resume_from_index": None}
    except Exception:
        return {"answers": None, "answered_ids": [], "resume_from_index": 0}


@router.put("/answer")
async def save_answer(request: Request, ctx: AuthContext = Depends(get_auth_context)):
    """Persist a single onboarding answer immediately (no batching)."""
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    body = await request.json()
    question_id = body.get("questionId") or body.get("question_id")
    value = body.get("value")
    if not question_id:
        raise HTTPException(400, detail="questionId is required")
    row = await execute_one_raw(
        """
        INSERT INTO onboarding_answers (tenant_id, question_id, value, answered_by, updated_at)
        VALUES (:tid, :qid, CAST(:val AS jsonb), :by, NOW())
        ON CONFLICT (tenant_id, question_id) DO UPDATE SET
          value = EXCLUDED.value, answered_by = EXCLUDED.answered_by, updated_at = NOW()
        RETURNING question_id, value, updated_at
        """,
        {
            "tid": ctx.tenant_id,
            "qid": question_id,
            "val": json.dumps(value),
            "by": ctx.user_id,
        },
    )
    return {"ok": True, "answer": row}

@router.post("")
async def save_onboarding(request: Request, ctx: AuthContext = Depends(get_auth_context)):
    try:
        answers = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid onboarding answers payload")

    if not isinstance(answers, dict):
        raise HTTPException(status_code=400, detail="Invalid onboarding answers payload")

    logger.info(f"[Onboarding] Received onboarding submission: {json.dumps(answers)[:150]}...")

    # 1. Save answers to settings table
    sql_settings = """
    INSERT INTO settings (key, value, description, updated_at)
    VALUES ('onboarding_answers', :val, 'User flashcard onboarding questionnaire preferences', NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    """
    await execute_raw(sql_settings, {"val": json.dumps(answers)})

    # 2. Sync tone and post_length settings if present
    tone = answers.get("tone")
    if tone:
        tone_str = str(tone).lower()
        tone_val = "casual"
        if "formal" in tone_str or "professional" in tone_str:
            tone_val = "formal"
        elif "witty" in tone_str:
            tone_val = "witty"
        elif "bold" in tone_str:
            tone_val = "bold & opinionated"

        await execute_raw(
            """INSERT INTO settings (key, value, updated_at)
               VALUES ('default_tone', :val, NOW())
               ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()""",
            {"val": tone_val}
        )

    post_length = answers.get("postLength")
    if post_length:
        len_str = str(post_length).lower()
        len_val = "short" if "short" in len_str else "long" if "long" in len_str else "medium"

        await execute_raw(
            """INSERT INTO settings (key, value, updated_at)
               VALUES ('post_length', :val, NOW())
               ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()""",
            {"val": len_val}
        )

    return {
        "ok": True,
        "post": None,
        "answers": answers,
    }
