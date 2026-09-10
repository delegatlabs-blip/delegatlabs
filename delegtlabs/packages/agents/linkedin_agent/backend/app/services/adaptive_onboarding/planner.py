"""Gemini structured planner for custom professions and follow-up candidates."""
from __future__ import annotations

import json
import logging
from typing import Any, Optional, Protocol

from pydantic import ValidationError

from app.services.adaptive_onboarding.schema import ContentDNA, PlannerOutput

logger = logging.getLogger(__name__)

PLANNER_SYSTEM_PROMPT = """You are the adaptive profiling engine for an AI LinkedIn thought-leadership assistant.

After each user answer, you produce the SINGLE next question.

Rules:
- Read lastAnswer and the Content DNA. The next question must follow from that answer.
- type MUST be single_select or multi_select. Never short_text, long_text, scale, or ranking.
- Provide 6–10 recommended options tailored to the last answer (labels a busy professional can tap).
- allowOther must be false. Do not ask the user to type, write, or describe anything.
- Never ask something already answered (see alreadyAskedIds and recentQAndA).
- Do not over-specialize forever. After professional context is clear, move to audience, problems, experience, point of view, goals, then content preferences.
- Never invent credentials, achievements, or opinions.
- Return JSON only: profileUpdates plus candidateQuestions with exactly one next question in index 0.
"""


class PlannerError(Exception):
    pass


class OnboardingPlanner(Protocol):
    def plan(
        self,
        profile: ContentDNA,
        last_answer: Any,
        asked_ids: list[str],
        recent_qa: list[dict] | None = None,
    ) -> PlannerOutput:
        ...


class GeminiPlanner:
    def plan(
        self,
        profile: ContentDNA,
        last_answer: Any,
        asked_ids: list[str],
        recent_qa: list[dict] | None = None,
    ) -> PlannerOutput:
        from google.genai import types
        from app.core.config import settings
        from app.services.gemini import get_client

        if not settings.GEMINI_API_KEY:
            raise PlannerError("GEMINI_API_KEY is not configured")

        payload = {
            "profile": profile.model_dump(exclude={"raw_answers", "field_meta"}),
            "lastAnswer": last_answer,
            "alreadyAskedIds": asked_ids,
            "recentQAndA": recent_qa or [],
            "schema": {
                "profileUpdates": [
                    {"field": "string", "value": "string|array", "confidence": 0.0, "source": "ai"}
                ],
                "candidateQuestions": [
                    {
                        "category": "string",
                        "profileFieldsTargeted": ["string"],
                        "title": "string",
                        "description": "string",
                        "type": "single_select|multi_select",
                        "options": [{"value": "string", "label": "string", "description": "string"}],
                        "allowOther": False,
                        "importance": 0.0,
                        "estimatedEffort": 0.0,
                        "reason": "string",
                    }
                ],
            },
        }
        client = get_client()
        models_to_try = list(
            dict.fromkeys(
                [settings.GEMINI_MODEL, settings.GEMINI_FALLBACK_MODEL, "gemini-2.0-flash"]
            )
        )
        last_error: Optional[str] = None
        for model_name in models_to_try:
            try:
                config = types.GenerateContentConfig(
                    system_instruction=PLANNER_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    temperature=0.3,
                )
                response = client.models.generate_content(
                    model=model_name,
                    contents=json.dumps(payload, default=str),
                    config=config,
                )
                raw = (response.text or "").strip()
                if not raw:
                    last_error = "empty response"
                    continue
                parsed = json.loads(raw)
                return PlannerOutput.model_validate(parsed)
            except (ValidationError, json.JSONDecodeError) as e:
                last_error = f"invalid planner output: {e}"
                logger.warning("[OnboardingPlanner] %s on %s", last_error, model_name)
            except Exception as e:
                last_error = str(e)
                logger.warning("[OnboardingPlanner] %s failed: %s", model_name, e)
        raise PlannerError(last_error or "planner unavailable")
