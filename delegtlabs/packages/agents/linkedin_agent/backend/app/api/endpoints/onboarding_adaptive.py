"""Adaptive onboarding HTTP API."""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.auth_context import AuthContext, get_auth_context
from app.api.deps import require_auth
from app.core.database import execute_one_raw, execute_raw
from app.services.adaptive_onboarding.engine import AdaptiveOnboardingEngine
from app.services.adaptive_onboarding.legacy import dna_to_legacy
from app.services.adaptive_onboarding.persistence import (
    delete_state,
    get_or_migrate,
    save_state,
)
from app.services.adaptive_onboarding.schema import ContentDNA, SessionState

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/onboarding",
    tags=["onboarding"],
    dependencies=[Depends(require_auth)],
)

_engine = AdaptiveOnboardingEngine()


def _client_payload(
    profile: ContentDNA,
    session: SessionState,
    *,
    extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    q = session.current_question
    payload = {
        "answers": dna_to_legacy(profile),
        "answered_ids": session.asked_ids,
        "resume_from_index": None,
        "adaptive": {
            "status": session.status,
            "coverage": session.coverage,
            "questionsAnswered": session.questions_answered,
            "currentQuestion": q.model_dump() if q else None,
            "canGoBack": bool(session.history),
            "complete": session.status == "completed",
            "finishAcknowledged": bool(session.finish_acknowledged),
            "aiUsed": session.last_ai_used,
            "latencyMs": session.last_latency_ms,
        },
        "profile": {
            "profession": profile.profession,
            "primaryDomain": profile.primary_domain,
            "specialty": profile.specialty,
            "coverage": profile.profile_coverage,
        },
    }
    if extra:
        payload.update(extra)
    return payload


async def _persist_legacy_blob(tenant_id: str, profile: ContentDNA, user_id: str) -> None:
    answers = dna_to_legacy(profile)
    await execute_raw(
        """
        INSERT INTO onboarding_answers (tenant_id, question_id, value, answered_by, updated_at)
        VALUES (:tid, 'legacy_blob', CAST(:val AS jsonb), :by, NOW())
        ON CONFLICT (tenant_id, question_id) DO UPDATE SET
          value = EXCLUDED.value, answered_by = EXCLUDED.answered_by, updated_at = NOW()
        """,
        {"tid": tenant_id, "val": json.dumps(answers), "by": user_id},
    )
    for key, val in answers.items():
        await execute_one_raw(
            """
            INSERT INTO onboarding_answers (tenant_id, question_id, value, answered_by, updated_at)
            VALUES (:tid, :qid, CAST(:val AS jsonb), :by, NOW())
            ON CONFLICT (tenant_id, question_id) DO UPDATE SET
              value = EXCLUDED.value, answered_by = EXCLUDED.answered_by, updated_at = NOW()
            RETURNING question_id
            """,
            {"tid": tenant_id, "qid": key, "val": json.dumps(val), "by": user_id},
        )


def _log(event: str, **props: Any) -> None:
    logger.info("[onboarding] %s %s", event, json.dumps(props, default=str)[:500])


async def load_onboarding_payload(ctx: AuthContext) -> Dict[str, Any]:
    profile, session = await get_or_migrate(ctx.tenant_id)
    if session.current_question is None and session.status != "completed":
        result = _engine.start(profile, session)
        profile, session = result.profile, result.session
        await save_state(ctx.tenant_id, profile, session, ctx.user_id)
        _log("onboarding_started", tenant=ctx.tenant_id)
    return _client_payload(profile, session)


@router.post("/adaptive/answer")
async def adaptive_answer(request: Request, ctx: AuthContext = Depends(get_auth_context)):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    body = await request.json()
    question_id = body.get("questionId") or body.get("question_id")
    value = body.get("value")
    if not question_id:
        raise HTTPException(400, detail="questionId is required")
    profile, session = await get_or_migrate(ctx.tenant_id)
    coverage_before = session.coverage
    try:
        result = _engine.process_answer(profile, session, question_id, value)
    except ValueError as e:
        raise HTTPException(400, detail=str(e)) from e
    await save_state(ctx.tenant_id, result.profile, result.session, ctx.user_id)
    await _persist_legacy_blob(ctx.tenant_id, result.profile, ctx.user_id)
    _log(
        "adaptive_question_answered",
        questionId=question_id,
        questionCategory=session.history[-1].question.category if result.session.history else None,
        questionType=session.history[-1].question.type if result.session.history else None,
        answerMethod=session.history[-1].answer_method if result.session.history else None,
        questionIndex=result.session.questions_answered,
        profileCoverageBefore=coverage_before,
        profileCoverageAfter=result.session.coverage,
        aiGeneratedQuestion=bool(result.session.current_question and result.session.current_question.generatedBy == "ai"),
        latency=result.latency_ms,
        fallback=result.fallback_used,
    )
    extra = {"ok": True, "personalizing": False}
    if result.complete:
        _log("onboarding_completed", coverage=result.session.coverage)
    return _client_payload(result.profile, result.session, extra=extra)


@router.post("/adaptive/back")
async def adaptive_back(ctx: AuthContext = Depends(get_auth_context)):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    profile, session = await get_or_migrate(ctx.tenant_id)
    result = _engine.go_back(profile, session)
    await save_state(ctx.tenant_id, result.profile, result.session, ctx.user_id)
    _log("question_back", questionsAnswered=result.session.questions_answered)
    return _client_payload(result.profile, result.session)


@router.post("/adaptive/reset")
async def adaptive_reset(ctx: AuthContext = Depends(get_auth_context)):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    await delete_state(ctx.tenant_id)
    result = _engine.reset()
    await save_state(ctx.tenant_id, result.profile, result.session, ctx.user_id)
    _log("onboarding_reset", tenant=ctx.tenant_id)
    return _client_payload(result.profile, result.session)


@router.post("/adaptive/complete")
async def adaptive_complete(ctx: AuthContext = Depends(get_auth_context)):
    """Settings sync. First posts come from the generate cron (Q-11)."""
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    profile, session = await get_or_migrate(ctx.tenant_id)
    answers = dna_to_legacy(profile)
    await execute_raw(
        """
        INSERT INTO settings (key, value, description, updated_at)
        VALUES ('onboarding_answers', :val, 'User flashcard onboarding questionnaire preferences', NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        """,
        {"val": json.dumps(answers)},
    )
    if profile.tone:
        tone_str = str(profile.tone[0]).lower()
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
            {"val": tone_val},
        )
    if profile.preferred_length:
        len_str = str(profile.preferred_length).lower()
        len_val = "short" if "short" in len_str else "long" if "long" in len_str else "medium"
        await execute_raw(
            """INSERT INTO settings (key, value, updated_at)
               VALUES ('post_length', :val, NOW())
               ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()""",
            {"val": len_val},
        )

    session.status = "completed"
    session.current_question = None
    session.finish_acknowledged = True
    await save_state(ctx.tenant_id, profile, session, ctx.user_id)

    _log("onboarding_completed", coverage=session.coverage, hadPost=False)
    return {
        "ok": True,
        "post": None,
        "postError": None,
        "answers": answers,
        **_client_payload(profile, session),
    }
