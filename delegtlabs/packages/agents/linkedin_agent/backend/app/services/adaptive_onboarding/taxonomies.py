"""Option lists and profession classifiers for the hybrid engine."""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

from app.services.adaptive_onboarding.schema import ProfileUpdate, QuestionOption
from app.services.adaptive_onboarding.weights import (
    FOUNDER_ALIASES,
    LAWYER_ALIASES,
    PHYSICIAN_ALIASES,
    TECH_INDUSTRY_IDS,
)


def opt(value: str, label: str, description: Optional[str] = None) -> QuestionOption:
    return QuestionOption(value=value, label=label, description=description)


INDUSTRY_OPTIONS: List[QuestionOption] = [
    opt("Web Development", "Web Development", "React, Next.js, Vue, Node, Fullstack"),
    opt("AI/ML", "AI & Machine Learning", "LLMs, Prompt Eng, Agents, PyTorch"),
    opt("DevOps", "DevOps & SRE", "Docker, Kubernetes, CI/CD, Terraform"),
    opt("Mobile Development", "Mobile Development", "React Native, Flutter, iOS, Android"),
    opt("Cloud/Infra", "Cloud & Infrastructure", "AWS, GCP, Serverless, Edge, Architecture"),
    opt("Cybersecurity", "Cybersecurity", "AppSec, OAuth, Zero Trust, DevSecOps"),
    opt("Data Science", "Data Science & Analytics", "Python, SQL, ML pipelines, Data Viz"),
    opt("Product/Design", "Product & UX Design", "UI/UX, Product Strategy, Design Systems"),
    opt("Startups/Founders", "Startups & Founders", "MVP, Tech Stack, Bootstrapping, Scaling"),
    opt("Doctor", "Doctor / Physician", "Clinical practice, specialty care, health systems"),
    opt("Lawyer", "Lawyer / Attorney", "Legal practice, counsel, regulation"),
]

SOFTWARE_AREA_OPTIONS = [
    opt("Frontend", "Frontend"),
    opt("Backend", "Backend"),
    opt("Full Stack", "Full Stack"),
    opt("Mobile", "Mobile"),
    opt("DevOps / Platform", "DevOps / Platform"),
    opt("Cloud", "Cloud"),
    opt("Data", "Data"),
    opt("AI Engineering", "AI Engineering"),
    opt("Security", "Security"),
    opt("Engineering Leadership", "Engineering Leadership"),
]

TECH_EXPERIENCE_OPTIONS = [
    opt("JavaScript/TypeScript systems", "JavaScript / TypeScript systems"),
    opt("API and data modeling", "APIs and data modeling"),
    opt("Cloud architecture", "Cloud architecture"),
    opt("Product delivery under constraints", "Shipping under real constraints"),
    opt("Team / platform enablement", "Team and platform enablement"),
]

MEDICAL_SPECIALTY_OPTIONS = [
    opt("General Medicine", "General Medicine"),
    opt("Cardiology", "Cardiology"),
    opt("Neurology", "Neurology"),
    opt("Orthopedics", "Orthopedics"),
    opt("Dermatology", "Dermatology"),
    opt("Pediatrics", "Pediatrics"),
    opt("Psychiatry", "Psychiatry"),
    opt("Radiology", "Radiology"),
    opt("Surgery", "Surgery"),
    opt("Oncology", "Oncology"),
]

CARDIOLOGY_AREA_OPTIONS = [
    opt("Interventional cardiology", "Interventional cardiology"),
    opt("Heart failure", "Heart failure"),
    opt("Electrophysiology", "Electrophysiology"),
    opt("Preventive cardiology", "Preventive cardiology"),
    opt("Imaging", "Cardiac imaging"),
]

LEGAL_AREA_OPTIONS = [
    opt("Corporate", "Corporate"),
    opt("Litigation", "Litigation"),
    opt("IP", "Intellectual property"),
    opt("Employment", "Employment"),
    opt("Regulatory", "Regulatory / compliance"),
    opt("Criminal", "Criminal"),
    opt("Family", "Family"),
]

FOUNDER_INDUSTRY_OPTIONS = [
    opt("SaaS", "SaaS"),
    opt("Marketplace", "Marketplace"),
    opt("Healthcare", "Healthcare"),
    opt("Fintech", "Fintech"),
    opt("Consumer", "Consumer"),
    opt("Deep tech", "Deep tech / hardware"),
]

FOUNDER_CUSTOMER_OPTIONS = [
    opt("B2B", "B2B"),
    opt("B2C", "B2C"),
    opt("B2B2C", "B2B2C"),
]

AUDIENCE_OPTIONS = [
    opt("Peers in my specialty", "Peers in my specialty"),
    opt("Leaders and executives", "Leaders and executives"),
    opt("Practitioners across the field", "Practitioners across the field"),
    opt("Founders and operators", "Founders and operators"),
    opt("Students and early-career", "Students and early-career"),
    opt("Customers / general public", "Customers / general public"),
    opt("Researchers", "Researchers"),
]

GOAL_OPTIONS = [
    opt("thought_leadership", "Thought leadership", "Distinctive points of view in the field"),
    opt("personal_brand", "Personal brand", "Be known for a specific expertise"),
    opt("education", "Education", "Teach what you have learned"),
    opt("leads", "Leads", "Attract clients or opportunities"),
    opt("career_growth", "Career growth", "Open doors for the next role"),
    opt("community", "Community", "Build a peer network"),
    opt("founder_brand", "Founder brand", "Build in public around the company"),
    opt("networking", "Networking", "Start conversations with the right people"),
]

FORMAT_OPTIONS = [
    opt("story", "Story"),
    opt("opinion", "Opinion"),
    opt("tutorial", "Tutorial / how-to"),
    opt("framework", "Framework"),
    opt("list", "List"),
    opt("case_study", "Case study"),
    opt("commentary", "Commentary"),
    opt("lesson", "Lesson learned"),
]

TONE_OPTIONS = [
    opt("Casual & Conversational", "Casual & Conversational"),
    opt("Professional & Polished", "Professional & Polished"),
    opt("Witty & Lighthearted", "Witty & Lighthearted"),
    opt("Bold & Opinionated", "Bold & Opinionated"),
    opt("Neutral & Informative", "Neutral & Informative"),
]

AUDIENCE_PROBLEM_OPTIONS = [
    opt("Making high-stakes decisions with incomplete information", "High-stakes decisions with incomplete information"),
    opt("Keeping up with change in the field", "Keeping up with change in the field"),
    opt("Turning expertise into trust", "Turning expertise into trust"),
    opt("Avoiding generic advice", "Avoiding generic advice"),
    opt("Hiring or being hired", "Hiring or being hired"),
    opt("Explaining complexity to non-specialists", "Explaining complexity to non-specialists"),
]

PILLAR_OPTIONS = [
    opt("How the work actually gets done", "How the work actually gets done"),
    opt("Mistakes and recoveries", "Mistakes and recoveries"),
    opt("Trade-offs others gloss over", "Trade-offs others gloss over"),
    opt("What is changing in the field", "What is changing in the field"),
    opt("How I think, not just what I know", "How I think, not just what I know"),
    opt("Teaching the next generation", "Teaching the next generation"),
]

EXPERIENCE_OPTIONS = [
    opt("A hard project I shipped or treated", "A hard project I shipped or treated"),
    opt("A failure I still use as a lesson", "A failure I still use as a lesson"),
    opt("Leading people through a messy change", "Leading people through a messy change"),
    opt("Building something from zero", "Building something from zero"),
    opt("Years of repeated pattern-matching", "Years of repeated pattern-matching"),
    opt("I would rather talk about methods than war stories", "I would rather talk about methods than war stories"),
]

POV_OPTIONS = [
    opt("The popular take in my field is oversold", "The popular take in my field is oversold"),
    opt("We under-invest in unglamorous fundamentals", "We under-invest in unglamorous fundamentals"),
    opt("Speed without judgment is expensive", "Speed without judgment is expensive"),
    opt("Most content in my niche is too generic", "Most content in my niche is too generic"),
    opt("I prefer evidence over hot takes", "I prefer evidence over hot takes"),
]

AVOID_OPTIONS = [
    opt("Medical or legal advice I am not giving", "Advice I am not qualified or allowed to give"),
    opt("Employer confidential work", "Employer-confidential work"),
    opt("Guaranteed outcomes", "Guaranteed outcomes"),
    opt("Personal attacks", "Personal attacks"),
    opt("Nothing specific", "Nothing specific — keep it professional"),
]


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def classify_free_text(text: str) -> List[ProfileUpdate]:
    """Deterministic first-pass for custom professions. Does not invent credentials."""
    blob = _norm(text)
    if not blob:
        return []
    updates: List[ProfileUpdate] = []

    def add(field: str, value: str, confidence: float) -> None:
        updates.append(
            ProfileUpdate(field=field, value=value, confidence=confidence, source="inferred")
        )

    if re.search(r"veterinar", blob):
        add("primary_domain", "Healthcare", 0.9)
        add("profession", "Veterinarian", 0.95)
        if "cardio" in blob:
            add("specialty", "Veterinary Cardiology", 0.9)
        if re.search(r"\bdogs?\b|canine", blob):
            add("sub_specialties", "Canine Cardiology", 0.8)
        return updates
    if re.search(r"underwater\s+robot", blob):
        add("primary_domain", "Robotics / Engineering", 0.92)
        add("profession", "Researcher", 0.9)
        add("specialty", "Underwater Robotics", 0.92)
        return updates
    if any(a in blob for a in PHYSICIAN_ALIASES) or re.search(r"\bdoctors?\b", blob):
        add("primary_domain", "Healthcare", 0.9)
        add("profession", "Physician", 0.92)
        if "cardio" in blob:
            add("specialty", "Cardiology", 0.88)
        return updates
    if any(a in blob for a in LAWYER_ALIASES):
        add("primary_domain", "Legal", 0.9)
        add("profession", "Lawyer", 0.92)
        return updates
    if any(a in blob for a in FOUNDER_ALIASES):
        add("primary_domain", "Startups", 0.85)
        add("profession", "Founder", 0.9)
        if "saas" in blob:
            add("industries", "SaaS", 0.85)
        return updates
    if re.search(r"software|developer|engineer|full.?stack|frontend|backend", blob):
        add("primary_domain", "Technology", 0.8)
        add("profession", "Software Developer", 0.8)
        return updates
    return updates


def profession_key(profession: Optional[str]) -> str:
    p = _norm(profession or "")
    if any(a in p for a in PHYSICIAN_ALIASES) or p == "physician":
        return "physician"
    if any(a in p for a in LAWYER_ALIASES):
        return "lawyer"
    if any(a in p for a in FOUNDER_ALIASES):
        return "founder"
    if "veterinar" in p:
        return "veterinarian"
    if "research" in p or "robot" in p:
        return "researcher"
    if any(k in p for k in ("developer", "engineer", "software")):
        return "software"
    return "other"


def has_tech_context(industries: List[str], profession: Optional[str]) -> bool:
    if any(i in TECH_INDUSTRY_IDS for i in industries):
        return True
    return profession_key(profession) == "software"


def industry_to_domain(industry_id: str) -> Tuple[str, Optional[str]]:
    if industry_id in TECH_INDUSTRY_IDS:
        return "Technology", "Software Developer"
    if industry_id == "Startups/Founders":
        return "Startups", "Founder"
    if industry_id in {"Doctor", "Healthcare"}:
        return "Healthcare", "Physician"
    if industry_id == "Lawyer":
        return "Legal", "Lawyer"
    return industry_id, None


def answer_strings(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    text = str(value).strip()
    return [text] if text else []
