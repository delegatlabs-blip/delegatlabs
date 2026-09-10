"""Adaptive onboarding engine tests (TS-12). Independent of UI."""
from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.services.adaptive_onboarding.coverage import calculate_coverage, should_end_onboarding
from app.services.adaptive_onboarding.engine import AdaptiveOnboardingEngine
from app.services.adaptive_onboarding.legacy import dna_to_legacy, legacy_to_dna
from app.services.adaptive_onboarding.planner import PlannerError
from app.services.adaptive_onboarding.question_bank import first_question, normalize_title
from app.services.adaptive_onboarding.schema import (
    AdaptiveQuestion,
    ContentDNA,
    PlannerCandidate,
    PlannerOutput,
    SessionState,
)
from app.services.adaptive_onboarding.weights import OnboardingLimits


def _engine(planner=None, use_ai=False, limits=None):
    return AdaptiveOnboardingEngine(
        planner=planner,
        use_ai=use_ai,
        limits=limits or OnboardingLimits(min_questions=6, max_questions=14, target_coverage=0.80),
    )


def _start(engine=None):
    eng = engine or _engine()
    result = eng.start()
    return eng, result.profile, result.session


def _answer(eng, profile, session, value):
    qid = session.current_question.id
    return eng.process_answer(profile, session, qid, value)


def test_scenario_1_web_development_then_fullstack_then_non_generic():
    eng, profile, session = _start()
    assert session.current_question.id == "q_identity_domain"
    r = _answer(eng, profile, session, ["Web Development"])
    assert "Web Development" in r.profile.industries
    assert r.question is not None
    assert r.question.id == "q_software_area"
    r = _answer(eng, r.profile, r.session, "Full Stack")
    assert r.profile.specialty == "Full Stack"
    assert r.question is not None
    assert r.question.id != "q_identity_domain"
    assert r.question.id in {"q_tech_experience", "q_audience", "q_goals", "q_pillars"}


def test_scenario_2_doctor_cardiology_then_shifts_off_medicine():
    eng, profile, session = _start()
    r = _answer(eng, profile, session, ["Doctor"])
    assert r.profile.profession == "Physician"
    assert r.question is not None
    assert r.question.id == "q_medical_specialty"
    r = _answer(eng, r.profile, r.session, "Cardiology")
    assert r.profile.specialty == "Cardiology"
    assert r.question is not None
    assert r.question.id != "q_cardiology_area"
    assert r.question.category in {"audience", "goals", "topics", "authority"}


def test_scenario_3_founder_saas_b2b():
    eng, profile, session = _start()
    r = _answer(eng, profile, session, ["Startups/Founders"])
    assert r.profile.profession == "Founder"
    assert r.question is not None
    r = _answer(eng, r.profile, r.session, "SaaS")
    assert "SaaS" in (r.profile.industries + [r.profile.current_professional_context or ""])
    r = _answer(eng, r.profile, r.session, "B2B")
    assert r.question is not None
    assert r.question.id != "q_identity_domain"


def test_scenario_4_underwater_robotics_custom():
    eng, profile, session = _start()
    r = _answer(eng, profile, session, ["Underwater robotics researcher"])
    assert r.profile.profession == "Researcher"
    assert r.profile.specialty == "Underwater Robotics"
    assert r.profile.primary_domain == "Robotics / Engineering"
    assert r.question is not None
    assert "medical" not in r.question.id
    assert r.question.id != "q_software_area"


def test_scenario_5_custom_medical_not_in_options():
    eng, profile, session = _start()
    r = _answer(eng, profile, session, ["Veterinary cardiologist mostly treating dogs"])
    assert r.profile.profession == "Veterinarian"
    assert r.profile.specialty == "Veterinary Cardiology"
    assert "Canine Cardiology" in r.profile.sub_specialties
    assert r.profile.raw_answers[0].value == ["Veterinary cardiologist mostly treating dogs"]


def test_scenario_6_back_invalidates_downstream_specialty():
    eng, profile, session = _start()
    r = _answer(eng, profile, session, ["Doctor"])
    r = _answer(eng, r.profile, r.session, "Cardiology")
    assert r.profile.specialty == "Cardiology"
    r = eng.go_back(r.profile, r.session)
    r = eng.go_back(r.profile, r.session)
    assert r.question.id == "q_identity_domain"
    r = _answer(eng, r.profile, r.session, ["Something else lawyer-ish", "Lawyer"])
    # "Lawyer" custom/mixed plus classify
    assert r.profile.profession == "Lawyer"
    assert r.profile.specialty != "Cardiology"


def test_scenario_7_ai_failure_returns_fallback():
    class Boom:
        def plan(self, *args, **kwargs):
            raise PlannerError("down")

    eng = _engine(planner=Boom(), use_ai=True)
    result = eng.start()
    r = _answer(eng, result.profile, result.session, ["Quantum pastry chef"])
    assert r.question is not None
    assert r.complete is False


def test_scenario_8_malformed_planner_output_is_rejected():
    with pytest.raises(ValidationError):
        PlannerOutput.model_validate("not-json")
    with pytest.raises(ValidationError):
        AdaptiveQuestion.model_validate(
            {
                "id": "x",
                "category": "identity",
                "profileFieldsTargeted": ["profession"],
                "title": "",
                "type": "single_select",
                "importance": 0.5,
                "estimatedEffort": 0.2,
            }
        )

    class Bad:
        def plan(self, *args, **kwargs):
            return PlannerOutput.model_validate(
                {
                    "candidateQuestions": [
                        {
                            "category": "identity",
                            "profileFieldsTargeted": ["specialty"],
                            "title": "",
                            "type": "single_select",
                            "options": [{"value": "a", "label": "A"}],
                            "importance": 0.9,
                            "estimatedEffort": 0.2,
                        }
                    ]
                }
            )

    eng = _engine(planner=Bad(), use_ai=True)
    result = eng.start()
    r = _answer(eng, result.profile, result.session, ["Obscure vocation xyzzy"])
    assert r.question is not None


def test_scenario_9_never_asks_duplicate_ids_or_titles():
    eng, profile, session = _start()
    seen = {session.current_question.id, normalize_title(session.current_question.title)}
    r = _answer(eng, profile, session, ["Web Development"])
    for _ in range(8):
        if r.complete or r.question is None:
            break
        assert r.question.type in {"single_select", "multi_select"}
        assert r.question.options and len(r.question.options) >= 2
        assert r.question.id not in seen
        assert normalize_title(r.question.title) not in seen
        seen.add(r.question.id)
        seen.add(normalize_title(r.question.title))
        val: object = "ok"
        if r.question.type == "multi_select":
            val = [r.question.options[0].value]
        else:
            val = r.question.options[0].value
        r = _answer(eng, r.profile, r.session, val)


def test_every_answer_uses_planner_mc_options():
    class Scripted:
        def plan(self, profile, last_answer, asked_ids, recent_qa=None):
            label = "Full Stack" if "Web" in str(last_answer) else "Peers in my specialty"
            return PlannerOutput(
                candidateQuestions=[
                    PlannerCandidate(
                        category="specialization",
                        profileFieldsTargeted=["specialty"],
                        title="Which area best matches that work?",
                        description="Recommended from your last answer.",
                        type="single_select",
                        options=[
                            {"value": "Full Stack", "label": "Full Stack"},
                            {"value": "Frontend", "label": "Frontend"},
                            {"value": "Backend", "label": "Backend"},
                            {"value": "Mobile", "label": "Mobile"},
                            {"value": "AI Engineering", "label": "AI Engineering"},
                            {"value": "Engineering Leadership", "label": "Engineering Leadership"},
                        ],
                        allowOther=False,
                        importance=0.9,
                        estimatedEffort=0.2,
                    )
                ]
            )

    eng = _engine(planner=Scripted(), use_ai=True)
    result = eng.start()
    r = _answer(eng, result.profile, result.session, ["Web Development"])
    assert r.ai_used is True
    assert r.question is not None
    assert r.question.type == "single_select"
    assert r.question.generatedBy == "ai"
    assert r.question.options and len(r.question.options) >= 6
    assert r.question.allowOther is False


def test_bank_fallback_is_never_free_text():
    from app.services.adaptive_onboarding.question_bank import all_bank_questions

    for q in all_bank_questions():
        assert q.type in {"single_select", "multi_select"}
        assert q.options and len(q.options) >= 2


def test_scenario_10_completes_before_max_when_coverage_met():
    limits = OnboardingLimits(min_questions=3, max_questions=14, target_coverage=0.2)
    eng = _engine(limits=limits)
    profile = ContentDNA(
        profession="Physician",
        primary_domain="Healthcare",
        specialty="Cardiology",
        industries=["Healthcare"],
        primary_audience=["Peers in my specialty"],
        audience_problems=["access to care"],
        primary_goal=["thought_leadership"],
        content_pillars=["clinical reasoning"],
        experiences=["ran a cath lab rotation"],
        strong_opinions=["prevention beats late intervention"],
    )
    session = SessionState(questions_answered=3, current_question=first_question())
    assert should_end_onboarding(profile, 3, limits) is True
    r = eng.process_answer(profile, session, "q_identity_domain", ["Healthcare"])
    assert r.complete is True
    assert r.session.status == "completed"


def test_legacy_mapping_preserves_static_answers():
    answers = {
        "industries": ["Web Development"],
        "targetAudience": "Senior developers",
        "contentGoal": "Build Thought Leadership",
        "tone": "Casual & Conversational",
        "topicsOfInterest": ["React"],
        "contentFormats": ["Short Takes"],
    }
    profile, session = legacy_to_dna(answers)
    assert session.status == "completed"
    assert "Web Development" in profile.industries
    roundtrip = dna_to_legacy(profile)
    assert roundtrip["industries"] == ["Web Development"]


def test_coverage_is_not_question_count_ratio():
    empty = ContentDNA()
    assert calculate_coverage(empty) == 0
    rich = ContentDNA(
        profession="Physician",
        primary_domain="Healthcare",
        specialty="Cardiology",
        primary_audience=["Hospital leadership"],
        audience_problems=["throughput"],
        primary_goal=["education"],
        content_pillars=["heart failure"],
        experiences=["20 years bedside"],
        strong_opinions=["less low-value testing"],
    )
    score = calculate_coverage(rich)
    assert 0.4 < score < 1.0
