"""In-memory topics store for TS-15 tests. No real Postgres."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any, Optional

DEFAULT_WEIGHT = 0.6
_NOW = datetime(2026, 9, 6, tzinfo=timezone.utc).isoformat()

SEED_CATALOG = (
    ("React New Feature", "react-new-feature", 0.5),
    ("Next.js New Feature", "nextjs-new-feature", 0.5),
    ("React vs Next.js", "react-vs-nextjs", 0.5),
    ("Dev Opinion", "dev-opinion", 0.4),
    ("Performance Tip", "performance-tip", 0.4),
    ("Migration Story", "migration-story", 0.3),
)
SEED_SLUGS = tuple(s[1] for s in SEED_CATALOG)

OPTION_SPECS = (
    ("lesson", "A lesson from a failed rollout", "What broke in production"),
    ("playbook", "A 3-step evaluation playbook", None),
    ("tradeoff", "Latency vs quality tradeoff", None),
    ("buyer", "What buyers actually ask", None),
    ("myth", "A myth your industry still believes", None),
)
PERSONA_NAMES = (
    "Shipping AI features without hype", "Evaluating models in production",
    "Buyer conversations that stall", "Latency vs quality in ranking",
    "Incident reviews without blame", "Hiring signals from shipping cadence",
    "Docs that engineers actually read", "Pricing experiments for AI tools",
    "Trust after a failed rollout", "Roadmaps that survive contact with users",
)


def default_options() -> list[dict]:
    return [{"value": v, "label": lab, "description": desc} for v, lab, desc in OPTION_SPECS]


def default_catalog() -> list[dict]:
    return [{"name": n, "options": default_options()} for n in PERSONA_NAMES]


class TopicStore:
    """In-memory topics + tenant_topic_replacements."""

    def __init__(self) -> None:
        self.topics: dict[int, dict] = {}
        self.replacements: set[str] = set()
        self._id = 1
        self.global_seed_deleted = False

    @classmethod
    def seeded(cls) -> "TopicStore":
        store = cls()
        for name, slug, weight in SEED_CATALOG:
            store.add_topic(
                name=name,
                slug=slug,
                weight=weight,
                is_active=True,
                tenant_id=None,
                options=[],
                selected_option=None,
            )
        return store

    def add_topic(self, **kwargs: Any) -> dict:
        rid = int(kwargs.pop("id", self._id))
        self._id = max(self._id, rid + 1)
        sel = kwargs.get("selected_option", kwargs.get("selected_option_value"))
        options = kwargs.get("options") or []
        if isinstance(options, str):
            options = json.loads(options)
        tid = kwargs.get("tenant_id") or kwargs.get("tid")
        row = {
            "id": rid,
            "name": kwargs.get("name"),
            "slug": kwargs.get("slug") or "persona-topic",
            "weight": float(kwargs.get("weight", DEFAULT_WEIGHT)),
            "is_active": bool(kwargs.get("is_active", False)),
            "tenant_id": str(tid) if tid else None,
            "options": options,
            "selected_option": sel,
            "published_count": int(kwargs.get("published_count") or 0),
            "avg_score": kwargs.get("avg_score"),
            "created_at": kwargs.get("created_at") or _NOW,
            "updated_at": kwargs.get("updated_at") or _NOW,
            "client_agent_id": kwargs.get("client_agent_id"),
        }
        self.topics[rid] = row
        return dict(row)

    def add_persona_catalog(self, tenant_id: str, catalog: list[dict]) -> list[dict]:
        self.replacements.add(str(tenant_id))
        rows = []
        for item in catalog:
            name = item["name"]
            slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "persona-topic"
            rows.append(
                self.add_topic(
                    name=name,
                    slug=slug,
                    weight=DEFAULT_WEIGHT,
                    is_active=False,
                    tenant_id=tenant_id,
                    options=item.get("options") or default_options(),
                    selected_option=None,
                )
            )
        return rows

    def exec(self, sql: str, params: Optional[dict] = None) -> list[dict]:
        params = dict(params or {})
        sl = " ".join(sql.split()).lower()
        if "pg_advisory" in sl:
            return []
        if "tenant_topic_replacements" in sl:
            tid = str(params.get("tenant_id") or params.get("tid") or "")
            if "insert" in sl:
                if tid:
                    self.replacements.add(tid)
                return [{"tenant_id": tid, "seed_replaced_at": _NOW}]
            if tid in self.replacements:
                return [{"tenant_id": tid, "seed_replaced_at": _NOW}]
            return []
        if re.search(r"\b(delete\s+from|truncate)\s+topics\b", sl):
            return self._delete(sl, params)
        if "insert" in sl and "topics" in sl:
            return [self.add_topic(**self._insert_kwargs(params))]
        if re.search(r"\bupdate\b", sl) and "topics" in sl:
            return self._update(sl, params)
        if "topics" in sl:
            return self._select(sl, params)
        return []

    def _insert_kwargs(self, params: dict) -> dict:
        out = dict(params)
        out.setdefault("slug", "persona-topic")
        out.setdefault("weight", DEFAULT_WEIGHT)
        out.setdefault("is_active", False)
        return out

    def _delete(self, sl: str, params: dict) -> list[dict]:
        if "tenant_id" not in sl:
            self.global_seed_deleted = True
            hit = [s for s in SEED_SLUGS if s in sl]
            if hit:
                self.topics = {i: r for i, r in self.topics.items() if r.get("slug") not in hit}
            elif "where" not in sl:
                self.topics.clear()
            return []
        tid = str(params.get("tenant_id") or params.get("tid") or "")
        self.topics = {i: r for i, r in self.topics.items() if r.get("tenant_id") != tid}
        return []

    def _update(self, sl: str, params: dict) -> list[dict]:
        sibling = ("id !=" in sl or "id<>" in sl or "id <>" in sl or "id!=" in sl) and (
            "is_active = false" in sl or "is_active=false" in sl
        )
        if sibling:
            keep = params.get("id")
            for row in self.topics.values():
                if keep is None or int(row["id"]) != int(keep):
                    row["is_active"] = False
            return []
        row = self._lookup(params)
        if row is None:
            return []
        for key, val in params.items():
            if key in ("id", "created_at"):
                continue
            if key in ("selected_option_value", "selected_option"):
                row["selected_option"] = val
                continue
            if key in row or key in ("name", "slug", "weight", "is_active", "options", "tenant_id"):
                if key == "options" and isinstance(val, str):
                    val = json.loads(val)
                if key == "weight" and val is not None:
                    val = float(val)
                row[key] = val
        row["updated_at"] = _NOW
        return [dict(row)]

    def _select(self, sl: str, params: dict) -> list[dict]:
        if " and false" in sl or sl.endswith(" false"):
            return []
        rows = list(self.topics.values())
        if params.get("id") is not None:
            rows = [r for r in rows if int(r["id"]) == int(params["id"])]
        tid = params.get("tenant_id") or params.get("tid")
        if "tenant_id is null" in sl:
            if tid is not None and ("tenant_id =" in sl or "tenant_id=" in sl):
                rows = [r for r in rows if r.get("tenant_id") is None or r.get("tenant_id") == str(tid)]
            else:
                rows = [r for r in rows if r.get("tenant_id") is None]
        elif "tenant_id is not null" in sl:
            rows = [r for r in rows if r.get("tenant_id") is not None]
            if tid is not None:
                rows = [r for r in rows if r.get("tenant_id") == str(tid)]
        elif tid is not None and "tenant_id" in sl:
            rows = [r for r in rows if r.get("tenant_id") == str(tid)]
        if "is_active = true" in sl or "is_active=true" in sl:
            rows = [r for r in rows if r.get("is_active") is True]
        rows.sort(key=lambda r: int(r["id"]))
        return [dict(r) for r in rows]

    def _lookup(self, params: dict) -> Optional[dict]:
        if params.get("id") is not None:
            return self.topics.get(int(params["id"]))
        return None
