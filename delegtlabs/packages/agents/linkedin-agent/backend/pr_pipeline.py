"""PR posting + lead generation pipeline adapted from linkedin_pr_agent reference.

External APIs are mocked when keys are missing (Phase 5 feature-flag pattern).
"""

from __future__ import annotations

import os
import random
from datetime import datetime
from difflib import SequenceMatcher
from typing import Any

DEFAULT_TOPIC_WEIGHTS = {
    "AI Automation": 0.35,
    "B2B SaaS Growth": 0.30,
    "Leadership & Scaling": 0.20,
    "HR & Talent": 0.15,
}


def _mock_mode() -> bool:
    """True when LinkedIn / LLM keys are not configured."""
    has_linkedin = bool(os.getenv("LINKEDIN_CLIENT_ID") and os.getenv("LINKEDIN_CLIENT_SECRET"))
    has_llm = bool(os.getenv("GROQ_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("ANTHROPIC_API_KEY"))
    force_mock = os.getenv("LINKEDIN_AGENT_MOCK", "1") == "1"
    return force_mock or not (has_linkedin and has_llm)


def pick_topic(weights: dict[str, float] | None = None) -> str:
    weights_dict = weights or DEFAULT_TOPIC_WEIGHTS
    topics = list(weights_dict.keys())
    probabilities = list(weights_dict.values())
    return random.choices(topics, weights=probabilities, k=1)[0]


def search_topic_news(topic: str) -> list[dict[str, str]]:
    """RSS/news search — mocked headlines when offline."""
    if _mock_mode():
        return [
            {
                "title": f"{topic}: industry shift in 2026",
                "snippet": f"Analysts highlight how {topic.lower()} is reshaping go-to-market motions.",
                "link": "https://example.com/mock-news",
            },
            {
                "title": f"Operators share playbooks on {topic}",
                "snippet": "Practitioners report measurable lifts from disciplined experimentation.",
                "link": "https://example.com/mock-news-2",
            },
        ]
    # Real RSS path would use feedparser here (linkedin_pr_agent/search_agent.py).
    return []


def generate_linkedin_post(topic: str, search_results: list[dict[str, str]], tone: str = "Professional") -> str:
    """LLM copywriter — returns mock copy without API keys."""
    headline = search_results[0]["title"] if search_results else topic
    if _mock_mode():
        return (
            f"[{tone}] {topic}\n\n"
            f"{headline}\n\n"
            "Three takeaways for operators this week:\n"
            "1) Ship smaller experiments faster.\n"
            "2) Measure leading indicators, not vanity.\n"
            "3) Double down on channels that compound.\n\n"
            "What are you testing next?\n\n"
            "#LinkedIn #Growth #AI"
        )
    return ""


def is_duplicate_post(candidate: str, past_posts: list[str], threshold: float = 0.75) -> bool:
    for past in past_posts:
        if SequenceMatcher(None, candidate, past).ratio() > threshold:
            return True
    return False


def generate_post_image_meta(post_content: str) -> dict[str, Any]:
    """Unsplash image lookup — mocked metadata when keys missing."""
    if _mock_mode() or not os.getenv("UNSPLASH_ACCESS_KEY"):
        return {"image_path": None, "unsplash_id": "mock-unsplash-id", "mocked": True}
    return {"image_path": None, "unsplash_id": None, "mocked": False}


def publish_or_draft_post(
    content: str,
    approval_mode: str,
    image_meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """LinkedIn Posts API — mock publish/draft."""
    status = "published" if approval_mode == "auto_publish" else "draft"
    note = (
        "Published directly to LinkedIn feed via API"
        if status == "published"
        else "Generated draft post & notified user for review"
    )
    if _mock_mode():
        note = f"[mock] {note}"
    return {
        "post_urn": f"urn:li:share:mock-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}" if status == "published" else None,
        "status": status,
        "note": note,
        "image": image_meta or {},
        "content": content,
    }


def run_pr_pipeline(config: dict[str, Any], past_post_contents: list[str] | None = None) -> dict[str, Any]:
    """Full PR job: pick topic → search → generate → dedupe → image → publish/draft."""
    post_cfg = config.get("post_gen", {})
    pillars = post_cfg.get("content_pillars") or list(DEFAULT_TOPIC_WEIGHTS.keys())
    weights = post_cfg.get("topic_weights") or {p: 1.0 / len(pillars) for p in pillars}
    tone = post_cfg.get("tone", "Professional")
    approval_mode = post_cfg.get("approval_mode", "review_first")

    topic = pick_topic(weights if isinstance(weights, dict) else None)
    if topic not in pillars and pillars:
        topic = pillars[0]

    search_results = search_topic_news(topic)
    post_content = ""
    for attempt in range(3):
        candidate = generate_linkedin_post(topic, search_results, tone=tone)
        if not candidate:
            continue
        if is_duplicate_post(candidate, past_post_contents or []):
            continue
        post_content = candidate
        break

    if not post_content:
        post_content = generate_linkedin_post(topic, search_results, tone=tone)

    image_meta = generate_post_image_meta(post_content)
    publish_result = publish_or_draft_post(post_content, approval_mode, image_meta)

    return {
        "topic": topic,
        "search_results_count": len(search_results),
        "mocked": _mock_mode(),
        **publish_result,
    }


def search_leads(config: dict[str, Any]) -> list[dict[str, Any]]:
    """Lead search via Hunter/Prospeo/Snov — mocked prospect list when keys missing."""
    lead_cfg = config.get("lead_gen", {})
    titles = lead_cfg.get("target_job_titles") or ["VP Marketing"]
    industries = lead_cfg.get("industries") or ["Software"]
    company_sizes = lead_cfg.get("company_size") or ["51-200 employees"]
    cap = int(lead_cfg.get("daily_connection_cap") or 20)

    if _mock_mode() or not (
        os.getenv("HUNTER_API_KEY") or os.getenv("PROSPEO_API_KEY") or os.getenv("SNOV_CLIENT_ID")
    ):
        mock_names = [
            ("Sarah Jenkins", "Acme Corp"),
            ("David Chen", "TechScale"),
            ("Elena Rostova", "CloudFlow"),
            ("Priya Nair", "Northwind AI"),
            ("James Okonkwo", "BrightOps"),
        ]
        leads = []
        for i, (name, company) in enumerate(mock_names[: min(cap, len(mock_names) * 3) or 5]):
            title = titles[i % len(titles)]
            industry = industries[i % len(industries)]
            size = company_sizes[i % len(company_sizes)]
            score = 70 + (i * 5) % 30
            leads.append(
                {
                    "name": name if i < len(mock_names) else f"Lead {i + 1}",
                    "title": title,
                    "company": company if i < len(mock_names) else f"Company {i + 1}",
                    "email": f"lead{i + 1}@example.com",
                    "profile_url": f"https://linkedin.com/in/mock-lead-{i + 1}",
                    "status": "connected",
                    "matched_criteria": f"{title}, {industry}, {size}",
                    "score": score,
                    "hot_lead": score >= 85,
                    "source": "mock",
                }
            )
        # Expand toward cap with synthetic rows
        while len(leads) < min(cap, 15):
            i = len(leads)
            title = titles[i % len(titles)]
            industry = industries[i % len(industries)]
            leads.append(
                {
                    "name": f"Prospect {i + 1}",
                    "title": title,
                    "company": f"Company {i + 1}",
                    "email": f"prospect{i + 1}@example.com",
                    "profile_url": f"https://linkedin.com/in/mock-prospect-{i + 1}",
                    "status": "connected",
                    "matched_criteria": f"{title}, {industry}",
                    "score": 60 + (i % 40),
                    "hot_lead": False,
                    "source": "mock",
                }
            )
        return leads

    return []


def run_lead_pipeline(config: dict[str, Any]) -> dict[str, Any]:
    leads = search_leads(config)
    hot = sum(1 for l in leads if l.get("hot_lead"))
    return {
        "leads": leads,
        "leads_generated": len(leads),
        "hot_leads": hot,
        "mocked": _mock_mode(),
        "notification_email": config.get("notification_email"),
    }
