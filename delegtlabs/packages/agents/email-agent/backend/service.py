from datetime import datetime, timedelta, date
from typing import Any
import uuid


class EmailAgentService:
    @staticmethod
    def get_admin_stats() -> dict[str, Any]:
        today = date.today()
        daily_metrics = [
            {
                "date": (today - timedelta(days=i)).isoformat(),
                "emails_sent": float(150 + (i % 4) * 30),
                "replies_received": float(8 + (i % 3) * 4)
            } for i in range(30, -1, -1)
        ]
        recent_runs = [
            {
                "id": str(uuid.uuid4()),
                "run_type": "sequence_dispatch",
                "status": "success",
                "started_at": (datetime.now() - timedelta(hours=i * 2)).isoformat(),
                "output_summary": {"emails_dispatched": 45, "delivered": 44}
            } for i in range(20)
        ]
        return {
            "active_customers": 22,
            "mrr_attributed": 4378.00,
            "error_rate_7d": 1.2,
            "recent_runs": recent_runs,
            "daily_metrics_30d": daily_metrics
        }

    @staticmethod
    def get_user_stats() -> dict[str, Any]:
        return {
            "sequences": [
                {"id": "eq1", "name": "Cold Outreach - CTOs & VPs", "subject": "Quick question regarding {{company}} Tech Stack", "open_rate": "68%", "reply_rate": "14%"},
            ],
            "emails_sent_today": 184,
            "deliverability_score": "98.4%"
        }
