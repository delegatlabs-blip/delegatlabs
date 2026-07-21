from datetime import datetime, timedelta, date
from typing import Any
import uuid


class FacebookAdsAgentService:
    @staticmethod
    def get_admin_stats() -> dict[str, Any]:
        today = date.today()
        daily_metrics = [
            {
                "date": (today - timedelta(days=i)).isoformat(),
                "ad_spend": float(250 + (i % 5) * 40),
                "conversions": float(15 + (i % 3) * 6)
            } for i in range(30, -1, -1)
        ]
        recent_runs = [
            {
                "id": str(uuid.uuid4()),
                "run_type": "ad_creative_optimization",
                "status": "success" if i % 6 != 0 else "failed",
                "started_at": (datetime.now() - timedelta(hours=i * 6)).isoformat(),
                "finished_at": (datetime.now() - timedelta(hours=i * 6 - 1)).isoformat(),
                "output_summary": {"campaigns_optimized": 3, "avg_roas": 3.82},
                "error_message": "Meta Ad Account Spending Limit Reached" if i % 6 == 0 else None
            } for i in range(20)
        ]
        return {
            "active_customers": 14,
            "mrr_attributed": 4180.00,
            "error_rate_7d": 5.0,
            "recent_runs": recent_runs,
            "daily_metrics_30d": daily_metrics
        }

    @staticmethod
    def get_user_stats() -> dict[str, Any]:
        return {
            "campaigns": [
                {"id": "c1", "name": "Retargeting - Q3 SaaS Promo", "budget": 1500, "roas": 4.2, "conversions": 182, "status": "active"},
                {"id": "c2", "name": "Lookalike 1% - High Intent", "budget": 2500, "roas": 3.6, "conversions": 240, "status": "active"},
            ],
            "top_performing_ad": "Carousel Ad #4 - Feature Spotlight",
            "avg_cpa": "$14.20"
        }
