from datetime import datetime, timedelta, date
from typing import Any
import uuid


class LinkedInAgentService:
    @staticmethod
    def get_admin_stats() -> dict[str, Any]:
        # Aggregate stats or seeded defaults for initial checkpoint
        today = date.today()
        daily_metrics = []
        for i in range(30, -1, -1):
            d = today - timedelta(days=i)
            daily_metrics.append({
                "date": d.isoformat(),
                "leads_generated": float(12 + (i % 7) * 3),
                "posts_published": float(1 + (i % 2))
            })

        recent_runs = [
            {
                "id": str(uuid.uuid4()),
                "run_type": "post_generation",
                "status": "success",
                "started_at": (datetime.now() - timedelta(hours=i * 4)).isoformat(),
                "finished_at": (datetime.now() - timedelta(hours=i * 4 - 1)).isoformat(),
                "output_summary": {"posts_created": 1, "status": "draft"},
                "error_message": None
            } for i in range(20)
        ]
        # Introduce a couple failed runs for realistic error rate calculation
        recent_runs[2]["status"] = "failed"
        recent_runs[2]["error_message"] = "LinkedIn Auth Token Expired"
        recent_runs[7]["status"] = "failed"
        recent_runs[7]["error_message"] = "Rate limit reached"

        return {
            "active_customers": 18,
            "mrr_attributed": 4500.00,
            "error_rate_7d": 10.0,
            "recent_runs": recent_runs,
            "daily_metrics_30d": daily_metrics
        }

    @staticmethod
    def get_user_stats() -> dict[str, Any]:
        leads = [
            {"id": "1", "name": "Sarah Jenkins", "title": "VP Marketing", "company": "Acme Corp", "status": "connected", "matched_criteria": "VP Marketing, SaaS"},
            {"id": "2", "name": "David Chen", "title": "Head of Growth", "company": "TechScale", "status": "replied", "matched_criteria": "Head of Growth, Tech"},
            {"id": "3", "name": "Elena Rostova", "title": "CMO", "company": "CloudFlow", "status": "converted", "matched_criteria": "CMO, B2B"},
            {"id": "4", "name": "Michael Scott", "title": "Regional Manager", "company": "Dunder Mifflin", "status": "connected", "matched_criteria": "Manager"},
        ]
        posts = [
            {"id": "p1", "content": "How we scaled our outreach to 10k prospects with automated AI workflows. Here are 3 key lessons...", "status": "published", "likes": 142, "comments": 38, "shares": 12, "impressions": 3400, "published_at": "2026-07-20T10:00:00Z"},
            {"id": "p2", "content": "B2B SaaS growth tactics for 2026: Why personal branding is your strongest distribution channel.", "status": "published", "likes": 289, "comments": 54, "shares": 29, "impressions": 8200, "published_at": "2026-07-18T14:30:00Z"},
            {"id": "p3", "content": "Draft: 5 common mistakes founders make when setting up outbound campaigns.", "status": "draft", "likes": 0, "comments": 0, "shares": 0, "impressions": 0, "published_at": None},
        ]
        return {
            "leads": leads,
            "posts": posts,
            "best_performing_criteria": "VP Marketing in B2B SaaS",
            "best_performing_post_id": "p2"
        }
