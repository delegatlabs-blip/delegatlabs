from datetime import datetime, timedelta, date
from typing import Any
import uuid


class InstagramAgentService:
    @staticmethod
    def get_admin_stats() -> dict[str, Any]:
        today = date.today()
        daily_metrics = [
            {
                "date": (today - timedelta(days=i)).isoformat(),
                "reels_published": float(1 + (i % 2)),
                "reach": float(1200 + (i % 7) * 300)
            } for i in range(30, -1, -1)
        ]
        recent_runs = [
            {
                "id": str(uuid.uuid4()),
                "run_type": "reels_scriptwriting",
                "status": "success",
                "started_at": (datetime.now() - timedelta(hours=i * 12)).isoformat(),
                "output_summary": {"reels_created": 1, "script_status": "draft"}
            } for i in range(20)
        ]
        return {
            "active_customers": 12,
            "mrr_attributed": 2389.00,
            "error_rate_7d": 0.0,
            "recent_runs": recent_runs,
            "daily_metrics_30d": daily_metrics
        }

    @staticmethod
    def get_user_stats() -> dict[str, Any]:
        return {
            "posts": [
                {"id": "ig1", "caption": "3 AI automation tools you need in 2026 🚀", "status": "published", "likes": 542, "comments": 89},
                {"id": "ig2", "caption": "How to scale your personal brand from zero.", "status": "draft", "likes": 0, "comments": 0},
            ],
            "top_performing_pillar": "Reels & Shorts"
        }
