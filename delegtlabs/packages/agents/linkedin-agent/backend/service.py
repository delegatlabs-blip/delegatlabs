from datetime import datetime, timedelta, date
from typing import Any
import uuid


class LinkedInAgentService:
    _run_log: list[dict[str, Any]] = []

    @classmethod
    def record_run(cls, run: dict[str, Any]) -> dict[str, Any]:
        cls._run_log.insert(0, run)
        cls._run_log = cls._run_log[:50]
        return run

    @classmethod
    def get_admin_stats(cls) -> dict[str, Any]:
        today = date.today()
        daily_metrics = []
        for i in range(30, -1, -1):
            d = today - timedelta(days=i)
            daily_metrics.append(
                {
                    "date": d.isoformat(),
                    "leads_generated": float(12 + (i % 7) * 3),
                    "posts_published": float(1 + (i % 2)),
                }
            )

        recent_runs = list(cls._run_log) if cls._run_log else [
            {
                "id": str(uuid.uuid4()),
                "client_agent_id": f"ca-{i % 5}",
                "run_type": "post_generation" if i % 2 else "lead_generation",
                "status": "success",
                "started_at": (datetime.now() - timedelta(hours=i * 4)).isoformat(),
                "finished_at": (datetime.now() - timedelta(hours=i * 4 - 0.05)).isoformat(),
                "duration_ms": 180000,
                "output_summary": {"posts_created": 1, "status": "draft"} if i % 2 else {"leads_generated": 8},
                "error_message": None,
            }
            for i in range(20)
        ]
        if not cls._run_log:
            recent_runs[2]["status"] = "failed"
            recent_runs[2]["error_message"] = "LinkedIn Auth Token Expired"
            recent_runs[7]["status"] = "failed"
            recent_runs[7]["error_message"] = "Rate limit reached"

        failed = sum(1 for r in recent_runs[:10] if r.get("status") == "failed")
        error_rate = (failed / max(len(recent_runs[:10]), 1)) * 100

        return {
            "active_customers": 18,
            "mrr_attributed": 4500.00,
            "runs_24h": sum(
                1
                for r in recent_runs
                if datetime.fromisoformat(r["started_at"]) > datetime.now() - timedelta(hours=24)
            ),
            "runs_30d": len(recent_runs),
            "error_rate_7d": error_rate,
            "subscribers": [
                {"client_id": "c1", "name": "Acme SaaS", "plan": "Growth", "status": "active", "mrr": 250},
                {"client_id": "c2", "name": "Northwind Labs", "plan": "Starter", "status": "active", "mrr": 199},
                {"client_id": "c3", "name": "Beacon AI", "plan": "Growth", "status": "active", "mrr": 250},
            ],
            "lead_pipeline": {
                "discovered": 1240,
                "scored_hot": 186,
                "connected": 94,
                "converted": 21,
            },
            "credential_health": [
                {"provider": "linkedin", "status": "healthy", "expires_at": (datetime.now() + timedelta(days=40)).isoformat()},
                {"provider": "openai", "status": "healthy", "expires_at": None},
                {"provider": "rss", "status": "healthy", "expires_at": None},
            ],
            "recent_runs": recent_runs,
            "daily_metrics_30d": daily_metrics,
        }

    @staticmethod
    def get_user_stats() -> dict[str, Any]:
        leads = [
            {
                "id": "1",
                "name": "Sarah Jenkins",
                "title": "VP Marketing",
                "company": "Acme Corp",
                "score": 94,
                "status": "connected",
                "engagement": "replied",
                "matched_criteria": "VP Marketing, SaaS",
            },
            {
                "id": "2",
                "name": "David Chen",
                "title": "Head of Growth",
                "company": "TechScale",
                "score": 88,
                "status": "replied",
                "engagement": "engaged",
                "matched_criteria": "Head of Growth, Tech",
            },
            {
                "id": "3",
                "name": "Elena Rostova",
                "title": "CMO",
                "company": "CloudFlow",
                "score": 91,
                "status": "converted",
                "engagement": "converted",
                "matched_criteria": "CMO, B2B",
            },
            {
                "id": "4",
                "name": "Michael Scott",
                "title": "Regional Manager",
                "company": "Dunder Mifflin",
                "score": 62,
                "status": "connected",
                "engagement": "pending",
                "matched_criteria": "Manager",
            },
            {
                "id": "5",
                "name": "Priya Nair",
                "title": "Director of Demand Gen",
                "company": "Orbitly",
                "score": 79,
                "status": "new",
                "engagement": "not_contacted",
                "matched_criteria": "Demand Gen, SaaS",
            },
        ]
        posts = [
            {
                "id": "p1",
                "content": "How we scaled our outreach to 10k prospects with automated AI workflows. Here are 3 key lessons...",
                "status": "published",
                "thumbnail_url": None,
                "likes": 142,
                "comments": 38,
                "shares": 12,
                "impressions": 3400,
                "engagement_score": 78,
                "published_at": "2026-07-20T10:00:00Z",
            },
            {
                "id": "p2",
                "content": "B2B SaaS growth tactics for 2026: Why personal branding is your strongest distribution channel.",
                "status": "published",
                "thumbnail_url": None,
                "likes": 289,
                "comments": 54,
                "shares": 29,
                "impressions": 8200,
                "engagement_score": 92,
                "published_at": "2026-07-18T14:30:00Z",
            },
            {
                "id": "p3",
                "content": "Draft: 5 common mistakes founders make when setting up outbound campaigns.",
                "status": "draft",
                "thumbnail_url": None,
                "likes": 0,
                "comments": 0,
                "shares": 0,
                "impressions": 0,
                "engagement_score": 0,
                "published_at": None,
            },
        ]
        return {
            "status": "active",
            "worker_schedule": "0 */6 * * *",
            "next_run_at": None,
            "credentials": [
                {"provider": "linkedin", "label": "LinkedIn OAuth", "status": "connected"},
                {"provider": "openai", "label": "OpenAI", "status": "connected"},
                {"provider": "rss", "label": "RSS Feeds", "status": "connected"},
            ],
            "metrics": {
                "generated_posts": len(posts),
                "engagement_score": 85,
                "published_prs": sum(1 for p in posts if p["status"] == "published"),
            },
            "leads": leads,
            "posts": posts,
            "best_performing_criteria": "VP Marketing in B2B SaaS",
            "best_performing_post_id": "p2",
        }
