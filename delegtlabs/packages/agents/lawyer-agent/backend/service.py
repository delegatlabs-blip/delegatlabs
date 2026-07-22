from datetime import datetime, timedelta, date
from typing import Any
import uuid


def _mock_generate_draft(request: dict[str, Any]) -> dict[str, Any]:
    """Mock AI provider adapted from lawyer-agent MockAIProvider."""
    facts = request.get("structuredFacts") or request.get("structured_facts") or {}
    party = facts.get("Party Details", {})
    prop = facts.get("Property Details", {})
    rent = facts.get("Rent & Deposit", {})
    terms = facts.get("Agreement Terms", {})

    owner = party.get("Owner Full Name", "[Owner Name]")
    tenant = party.get("Tenant Full Name", "[Tenant Name]")
    address = prop.get("Property Full Address", "[Property Address]")
    monthly = rent.get("Monthly Rent Amount (INR)", "[Rent Amount]")
    deposit = rent.get("Security Deposit Amount (INR)", "[Deposit Amount]")
    duration = terms.get("Agreement Duration (Months)", "[Duration]")
    start = terms.get("Agreement Start Date", "[Start Date]")
    jurisdiction = request.get("jurisdiction", "Uttar Pradesh")
    draft_language = request.get("draftLanguage") or request.get("draft_language") or "en"
    draft_id = request.get("draftId") or request.get("draft_id") or "unknown"
    title = request.get("draftTitle") or request.get("draft_title") or "Legal Draft"

    if draft_language == "hi":
        draft_text = f"""{title}

यह अनुबंध पत्र आज दिनांक {start} को निम्नलिखित पक्षकारों के बीच निष्पादित किया गया:

प्रथम पक्ष: {owner}
द्वितीय पक्ष: {tenant}

संपत्ति: {address}
मासिक किराया: {monthly} INR
जमानत राशि: {deposit} INR
अवधि: {duration} माह
क्षेत्राधिकार: {jurisdiction}

[यह मॉक AI द्वारा उत्पन्न प्रारूप है — अधिवक्ता द्वारा समीक्षा आवश्यक है।]
"""
    else:
        draft_text = f"""{title.upper()}

This agreement is executed on {start} between:

First Party (Owner): {owner}
Second Party (Tenant): {tenant}

Property: {address}
Monthly Rent: INR {monthly}
Security Deposit: INR {deposit}
Duration: {duration} months
Governing Jurisdiction: {jurisdiction}

Clauses incorporated as selected. All facts are taken from the structured intake form.

[Mock AI draft — advocate review required before use.]
"""

    warnings = []
    if "[Owner Name]" in draft_text or "[Tenant Name]" in draft_text:
        warnings.append("Some party details were missing; placeholders remain in the draft.")

    return {
        "draftId": draft_id,
        "provider": "mock",
        "model": "delegatlabs-mock-v1",
        "status": "generated",
        "draftText": draft_text.strip(),
        "warnings": warnings,
        "generationId": str(uuid.uuid4()),
    }


class LawyerAgentService:
    @staticmethod
    def get_admin_stats() -> dict[str, Any]:
        today = date.today()
        daily_metrics = [
            {
                "date": (today - timedelta(days=i)).isoformat(),
                "drafts_generated": float(2 + (i % 5)),
            }
            for i in range(29, -1, -1)
        ]
        recent_runs = [
            {
                "id": str(uuid.uuid4()),
                "run_type": "draft_generation",
                "status": "success" if i not in (3, 11) else "failed",
                "started_at": (datetime.now() - timedelta(hours=i * 3)).isoformat(),
                "finished_at": (datetime.now() - timedelta(hours=i * 3 - 0.2)).isoformat(),
                "output_summary": {"draft_id": "rent_agreement"} if i not in (3, 11) else None,
                "error_message": "AI provider timeout" if i in (3, 11) else None,
            }
            for i in range(20)
        ]
        return {
            "active_customers": 9,
            "mrr_attributed": 2700.0,
            "runs_24h": 4,
            "runs_30d": len(recent_runs),
            "error_rate_7d": 10.0,
            "total_drafts": 148,
            "avg_completion_time_sec": 42.5,
            "subscribers": [
                {"client_id": "c1", "name": "Sharma & Co.", "plan": "Growth", "status": "active", "mrr": 299},
                {"client_id": "c2", "name": "LexForge LLP", "plan": "Starter", "status": "active", "mrr": 199},
            ],
            "recent_runs": [
                {
                    **r,
                    "status": (
                        "SUCCESS"
                        if r["status"] == "success"
                        else "FAILED"
                        if r["status"] == "failed"
                        else "RUNNING"
                    ),
                    "client_agent_id": f"ca-law-{i}",
                    "duration_ms": 42000,
                }
                for i, r in enumerate(recent_runs)
            ],
            "daily_metrics_30d": daily_metrics,
        }

    @staticmethod
    def get_user_stats() -> dict[str, Any]:
        return {
            "status": "active",
            "recent_draft_count": 12,
            "recent_drafts": [
                {
                    "id": "d1",
                    "draft_id": "nda",
                    "title": "NDA",
                    "status": "generated",
                    "language": "en",
                    "created_at": "2026-07-20T09:00:00Z",
                },
                {
                    "id": "d2",
                    "draft_id": "service_agreement",
                    "title": "Service Agreement",
                    "status": "draft",
                    "language": "en",
                    "created_at": "2026-07-18T14:00:00Z",
                },
            ],
            "drafts_this_month": 12,
            "avg_completeness": 86,
            "templates": ["NDA", "Service Agreement", "Employment Contract", "Term Sheet"],
        }

    @staticmethod
    def generate_draft(payload: dict[str, Any]) -> dict[str, Any]:
        provider = (payload.get("ai_provider") or payload.get("provider") or "mock").lower()
        # Real providers raise NotImplemented in reference — always safe-mock for v1
        if provider != "mock":
            # Attempt mock with warning when non-mock requested without keys
            result = _mock_generate_draft(payload)
            result["warnings"] = list(result.get("warnings") or []) + [
                f"Provider '{provider}' unavailable; used mock generator."
            ]
            result["provider"] = "mock"
            return result
        return _mock_generate_draft(payload)
