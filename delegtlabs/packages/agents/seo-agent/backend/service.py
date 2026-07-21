from datetime import datetime, timedelta, date
from typing import Any
import uuid


class SEOAgentService:
    @staticmethod
    def get_admin_stats() -> dict[str, Any]:
        today = date.today()
        daily_metrics = [
            {
                "date": (today - timedelta(days=i)).isoformat(),
                "articles_generated": float(1 + (i % 2)),
                "organic_traffic": float(400 + (i % 5) * 80)
            } for i in range(30, -1, -1)
        ]
        recent_runs = [
            {
                "id": str(uuid.uuid4()),
                "run_type": "keyword_audit_and_article_gen",
                "status": "success",
                "started_at": (datetime.now() - timedelta(hours=i * 24)).isoformat(),
                "output_summary": {"article_created": "The Future of AI Agents in 2026", "words": 1950}
            } for i in range(20)
        ]
        return {
            "active_customers": 16,
            "mrr_attributed": 3984.00,
            "error_rate_7d": 0.0,
            "recent_runs": recent_runs,
            "daily_metrics_30d": daily_metrics
        }

    @staticmethod
    def get_user_stats() -> dict[str, Any]:
        return {
            "keywords": [
                {"id": "kw1", "keyword": "b2b saas ai agents", "volume": 1200, "rank": 3},
                {"id": "kw2", "keyword": "multi agent delegation platform", "volume": 840, "rank": 1},
            ],
            "articles": [
                {"id": "art1", "title": "How Multi-Agent Workforces Are Transforming Enterprise Operations", "status": "published", "words": 2100},
            ],
            "organic_clicks_30d": 3420
        }
