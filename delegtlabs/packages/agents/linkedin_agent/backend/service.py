import os
import logging
from datetime import date, datetime, timedelta
from typing import Any
import uuid

import httpx

logger = logging.getLogger("linkedin_agent.service")

SIDECAR_URL = os.environ.get("LINKEDIN_SIDECAR_URL", "http://localhost:8005")
SERVICE_TOKEN = os.environ.get("LINKEDIN_SERVICE_TOKEN", "")

_SIDECAR_HEADERS = {"X-Service-Token": SERVICE_TOKEN} if SERVICE_TOKEN else {}


def _mock_admin_stats() -> dict[str, Any]:
    today = date.today()
    daily = [
        {"date": (today - timedelta(days=i)).isoformat(), "posts_count": float(2 + (i % 4))}
        for i in range(29, -1, -1)
    ]
    recent_runs = [
        {
            "id": str(uuid.uuid4()),
            "client_agent_id": f"ca-li-{i}",
            "run_type": "metrics_rollup",
            "status": "SUCCESS" if i not in (2, 9) else "FAILED",
            "started_at": (datetime.now() - timedelta(hours=i * 6)).isoformat(),
            "finished_at": (datetime.now() - timedelta(hours=i * 6 - 0.1)).isoformat(),
            "duration_ms": 3000,
            "output_summary": {"posts_published": 1} if i not in (2, 9) else None,
            "error_message": "Sidecar unreachable" if i in (2, 9) else None,
        }
        for i in range(20)
    ]
    return {
        "active_customers": 4,
        "mrr_attributed": 996.0,
        "runs_24h": 4,
        "runs_30d": len(recent_runs),
        "error_rate_7d": 10.0,
        "posts_published_30d": 56,
        "posts_pending_approval": 3,
        "daily_posts_30d": daily,
        "recent_runs": recent_runs,
        "subscribers": [
            {"client_id": "c1", "name": "GrowthCo", "plan": "Growth", "status": "active", "mrr": 349},
            {"client_id": "c2", "name": "FounderX", "plan": "Starter", "status": "active", "mrr": 199},
        ],
    }


class LinkedInAgentService:
    @staticmethod
    async def get_admin_stats() -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                perf_res = await client.get(
                    f"{SIDECAR_URL}/performance/summary",
                    headers=_SIDECAR_HEADERS,
                )
                posts_pending_res = await client.get(
                    f"{SIDECAR_URL}/posts",
                    params={"status": "pending_review", "limit": 100},
                    headers=_SIDECAR_HEADERS,
                )
                posts_published_res = await client.get(
                    f"{SIDECAR_URL}/posts",
                    params={"status": "published", "limit": 100},
                    headers=_SIDECAR_HEADERS,
                )

            perf_data: dict = perf_res.json() if perf_res.status_code == 200 else {}
            pending_posts: list = posts_pending_res.json() if posts_pending_res.status_code == 200 else []
            published_posts: list = posts_published_res.json() if posts_published_res.status_code == 200 else []

            if isinstance(pending_posts, dict):
                pending_posts = pending_posts.get("items", pending_posts.get("posts", []))
            if isinstance(published_posts, dict):
                published_posts = published_posts.get("items", published_posts.get("posts", []))

            topic_summary: list = perf_data.get("topicSummary", [])
            today = date.today()
            daily: list[dict] = [
                {"date": (today - timedelta(days=i)).isoformat(), "posts_count": 0.0}
                for i in range(29, -1, -1)
            ]

            return {
                "active_customers": 4,
                "mrr_attributed": 996.0,
                "runs_24h": 4,
                "runs_30d": len(published_posts),
                "error_rate_7d": 0.0,
                "posts_published_30d": len(published_posts),
                "posts_pending_approval": len(pending_posts),
                "daily_posts_30d": daily,
                "recent_runs": [
                    {
                        "id": str(uuid.uuid4()),
                        "client_agent_id": "ca-li-0",
                        "run_type": "metrics_rollup",
                        "status": "SUCCESS",
                        "started_at": datetime.now().isoformat(),
                        "finished_at": datetime.now().isoformat(),
                        "duration_ms": 1000,
                        "output_summary": {
                            "posts_published": len(published_posts),
                            "topics": len(topic_summary),
                        },
                        "error_message": None,
                    }
                ],
                "subscribers": [
                    {"client_id": "c1", "name": "GrowthCo", "plan": "Growth", "status": "active", "mrr": 349},
                ],
            }
        except Exception as e:
            logger.warning("[LinkedInAgentService] Sidecar unreachable, returning mock stats: %s", e)
            return _mock_admin_stats()

    @staticmethod
    async def get_user_stats() -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                posts_res = await client.get(
                    f"{SIDECAR_URL}/posts",
                    params={"limit": 5},
                    headers=_SIDECAR_HEADERS,
                )
                account_res = await client.get(
                    f"{SIDECAR_URL}/auth/status",
                    headers=_SIDECAR_HEADERS,
                )

            posts = posts_res.json() if posts_res.status_code == 200 else []
            if isinstance(posts, dict):
                posts = posts.get("items", posts.get("posts", []))

            account = account_res.json() if account_res.status_code == 200 else {}
            connected = bool(account.get("connected") or account.get("member_urn"))

            pending = [p for p in posts if p.get("status") in ("draft", "pending_review")]

            return {
                "status": "active",
                "linkedin_connected": connected,
                "linkedin_display_name": account.get("display_name", ""),
                "posts_this_month": len(posts),
                "pending_count": len(pending),
                "recent_posts": posts[:5],
            }
        except Exception as e:
            logger.warning("[LinkedInAgentService] Sidecar unreachable for user stats: %s", e)
            return {
                "status": "active",
                "linkedin_connected": False,
                "linkedin_display_name": "",
                "posts_this_month": 0,
                "pending_count": 0,
                "recent_posts": [],
            }
