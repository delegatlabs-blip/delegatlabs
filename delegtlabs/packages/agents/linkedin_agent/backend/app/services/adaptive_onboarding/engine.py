"""Next-best-question engine. Business logic lives here, not in React."""
from __future__ import annotations

import time
import uuid
from typing import Any, List, Optional

from pydantic import ValidationError

from app.services.adaptive_onboarding.coverage import calculate_coverage, should_end_onboarding
from app.services.adaptive_onboarding.normalize import (
    answer_method_for,
    apply_direct_fields,
    apply_identity_answer,
    remember_raw,
)
from app.services.adaptive_onboarding.planner import GeminiPlanner, PlannerError
from app.services.adaptive_onboarding.question_bank import (
    SELECTABLE_TYPES,
    coerce_selectable_current,
    eligible_bank_questions,
    fallback_question,
    first_question,
    normalize_title,
)
from app.services.adaptive_onboarding.schema import (
    AdaptiveQuestion,
    ContentDNA,
    EngineResult,
    HistoryEntry,
    PlannerCandidate,
    SessionState,
)
from app.services.adaptive_onboarding.scorer import rank_candidates
from app.services.adaptive_onboarding.taxonomies import answer_strings
from app.services.adaptive_onboarding.weights import OnboardingLimits, load_limits


def _preset_values(question: AdaptiveQuestion) -> List[str]:
    return [o.value for o in (question.options or [])]


def _candidate_to_question(c: PlannerCandidate) -> Optional[AdaptiveQuestion]:
    try:
        payload = c.model_dump()
        payload["id"] = f"q_ai_{uuid.uuid4().hex[:10]}"
        payload["generatedBy"] = "ai"
        payload.pop("reason", None)
        qtype = payload.get("type")
        if qtype not in SELECTABLE_TYPES:
            payload["type"] = "multi_select" if qtype == "ranking" else "single_select"
        payload["allowOther"] = False
        opts = payload.get("options") or []
        if len(opts) < 2:
            return None
        return AdaptiveQuestion.model_validate(payload)
    except ValidationError:
        return None


class AdaptiveOnboardingEngine:
    def __init__(
        self,
        planner=None,
        limits: Optional[OnboardingLimits] = None,
        use_ai: bool = True,
    ):
        self.planner = planner
        self.limits = limits or load_limits()
        self.use_ai = use_ai

    def start(self, profile: Optional[ContentDNA] = None, session: Optional[SessionState] = None) -> EngineResult:
        profile = profile or ContentDNA()
        session = session or SessionState()
        if session.current_question is None and session.status != "completed":
            session.current_question = first_question()
        coerce_selectable_current(profile, session)
        session.coverage = calculate_coverage(profile)
        return EngineResult(profile=profile, session=session, question=session.current_question)

    def process_answer(
        self,
        profile: ContentDNA,
        session: SessionState,
        question_id: str,
        value: Any,
    ) -> EngineResult:
        started = time.perf_counter()
        question = session.current_question
        if question is None or question.id != question_id:
            raise ValueError("question does not match the current step")
        if question.required and not answer_strings(value) and question.type != "scale":
            raise ValueError("an answer is required")

        method = answer_method_for(_preset_values(question), value)
        remember_raw(profile, question.id, value, method)
        written = self._apply_answer(profile, question, value)

        if question.category in {"identity", "specialization"}:
            session.identity_depth += 1

        session.history.append(
            HistoryEntry(
                question=question,
                raw_answer=value,
                fields_written=written,
                answer_method=method,
            )
        )
        session.asked_ids.append(question.id)
        session.asked_titles_normalized.append(normalize_title(question.title))
        session.questions_answered += 1
        session.coverage = calculate_coverage(profile)

        ai_used = False
        fallback_used = False
        if self.use_ai:
            ai_used, extra_written = self._run_planner(profile, session, value)
            written.extend(extra_written)
            session.history[-1].fields_written = list(dict.fromkeys(written))

        if should_end_onboarding(profile, session.questions_answered, self.limits):
            session.status = "completed"
            session.current_question = None
            session.coverage = calculate_coverage(profile)
            session.last_ai_used = ai_used
            session.last_latency_ms = int((time.perf_counter() - started) * 1000)
            return EngineResult(
                profile=profile,
                session=session,
                question=None,
                complete=True,
                ai_used=ai_used,
                fallback_used=fallback_used,
                latency_ms=session.last_latency_ms,
            )

        next_q, used_ai, used_fb = self._select_next(profile, session, last_value=value)
        ai_used = ai_used or used_ai
        fallback_used = used_fb
        session.current_question = next_q
        session.last_ai_used = ai_used
        session.last_latency_ms = int((time.perf_counter() - started) * 1000)
        session.coverage = calculate_coverage(profile)
        complete = next_q is None
        if complete:
            session.status = "completed"
        return EngineResult(
            profile=profile,
            session=session,
            question=next_q,
            complete=complete,
            ai_used=ai_used,
            fallback_used=fallback_used,
            latency_ms=session.last_latency_ms or 0,
        )

    def go_back(self, profile: ContentDNA, session: SessionState) -> EngineResult:
        if not session.history:
            if session.current_question is None:
                session.current_question = first_question()
            return EngineResult(profile=profile, session=session, question=session.current_question)
        entry = session.history.pop()
        profile.clear_fields(entry.fields_written)
        profile.raw_answers = [r for r in profile.raw_answers if r.question_id != entry.question.id]
        if entry.question.id in session.asked_ids:
            session.asked_ids.remove(entry.question.id)
        title_n = normalize_title(entry.question.title)
        session.asked_titles_normalized = [t for t in session.asked_titles_normalized if t != title_n]
        session.questions_answered = max(0, session.questions_answered - 1)
        if entry.question.category in {"identity", "specialization"}:
            session.identity_depth = max(0, session.identity_depth - 1)
        session.status = "in_progress"
        session.current_question = entry.question
        session.coverage = calculate_coverage(profile)
        return EngineResult(profile=profile, session=session, question=entry.question)

    def reset(self) -> EngineResult:
        profile = ContentDNA()
        session = SessionState(current_question=first_question())
        return EngineResult(profile=profile, session=session, question=session.current_question)

    def _apply_answer(self, profile: ContentDNA, question: AdaptiveQuestion, value: Any) -> List[str]:
        if question.id == "q_identity_domain":
            return apply_identity_answer(profile, value, question.id)
        if question.id == "q_software_area":
            written = apply_direct_fields(
                profile, ["specialty", "role"], value, question_id=question.id
            )
            return written
        if question.id == "q_founder_industry":
            written = apply_direct_fields(
                profile, ["current_professional_context", "industries"], value, question_id=question.id
            )
            return written
        return apply_direct_fields(
            profile, question.profileFieldsTargeted, value, question_id=question.id
        )

    def _run_planner(
        self, profile: ContentDNA, session: SessionState, last_value: Any
    ) -> tuple[bool, List[str]]:
        planner = self.planner if self.planner is not None else GeminiPlanner()
        written: List[str] = []
        recent_qa = [
            {"title": h.question.title, "answer": h.raw_answer}
            for h in session.history[-6:]
        ]
        try:
            output = planner.plan(profile, last_value, session.asked_ids, recent_qa)
        except (PlannerError, ValidationError, Exception):
            return False, written
        for upd in output.profileUpdates:
            if upd.field in {"experiences", "strong_opinions", "beliefs", "accomplishments"}:
                if upd.source == "ai" and upd.confidence < 0.95:
                    continue
            profile.set_field(
                upd.field,
                upd.value,
                source=upd.source if upd.source in {"answer", "ai", "inferred", "legacy"} else "ai",
                confidence=upd.confidence,
                question_id=session.current_question.id if session.current_question else None,
            )
            written.append(upd.field)
        session._planner_candidates = output.candidateQuestions  # type: ignore[attr-defined]
        return True, written

    def _select_next(
        self, profile: ContentDNA, session: SessionState, last_value: Any
    ) -> tuple[Optional[AdaptiveQuestion], bool, bool]:
        ai_qs: List[AdaptiveQuestion] = []
        ai_used = False
        planner_candidates = getattr(session, "_planner_candidates", None)
        if planner_candidates:
            for c in planner_candidates:
                q = _candidate_to_question(c)
                if q and q.type in SELECTABLE_TYPES:
                    ai_qs.append(q)
            session._planner_candidates = []  # type: ignore[attr-defined]

        if ai_qs:
            unique = [q for q in ai_qs if normalize_title(q.title) not in session.asked_titles_normalized]
            pick = unique[0] if unique else ai_qs[0]
            return pick, True, False

        if self.use_ai:
            planner = self.planner if self.planner is not None else GeminiPlanner()
            recent_qa = [
                {"title": h.question.title, "answer": h.raw_answer}
                for h in session.history[-6:]
            ]
            try:
                output = planner.plan(profile, last_value, session.asked_ids, recent_qa)
                ai_used = True
                generated: List[AdaptiveQuestion] = []
                for c in output.candidateQuestions:
                    q = _candidate_to_question(c)
                    if q and q.type in SELECTABLE_TYPES:
                        generated.append(q)
                if generated:
                    return generated[0], True, False
            except (PlannerError, ValidationError, TypeError, Exception):
                ai_used = False

        bank = eligible_bank_questions(profile, session.asked_ids)
        ranked = rank_candidates(bank, profile, session)
        if ranked:
            return ranked[0][1], ai_used, False

        fb = fallback_question(profile, session.asked_ids)
        if fb and fb.id not in session.asked_ids and fb.type in SELECTABLE_TYPES:
            return fb, ai_used, True
        return None, ai_used, True
