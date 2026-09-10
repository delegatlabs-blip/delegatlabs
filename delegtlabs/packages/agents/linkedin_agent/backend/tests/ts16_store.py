"""In-memory quota / jobs / posts store for TS-16 cron tests. No real Postgres.

Table names from C-subscription-quota-schema. SQL matching is table-name based
(same style as CatalogStore). Tests do not reverse-engineer generate_job.py.
"""
from __future__ import annotations

import json
import re
from datetime import date, datetime, timezone
from typing import Any, Optional
from uuid import uuid4

from tests.ts8_helpers import SEED_PLANS, TENANT_ID, plan_row

TENANT_B = "22222222-2222-2222-2222-222222222222"
SLOT_KINDS = ("daily_text", "daily_image", "weekly_image")


def monday_of(d: date) -> date:
    return d.fromordinal(d.toordinal() - d.isoweekday() + 1)


def plan_for_code(code: str) -> dict:
    spec = next(p for p in SEED_PLANS if p["code"] == code)
    return plan_row(
        code=spec["code"],
        name=spec["name"],
        tier=spec["tier"],
        price_inr_minor=spec["price_inr_minor"],
        price_usd_minor=spec["price_usd_minor"],
        monthly_credits=spec["monthly_credits"],
        daily_text=spec["daily_text"],
        daily_image=spec["daily_image"],
        weekly_image=spec["weekly_image"],
        is_default=spec["is_default"],
        agent_kind="post_gen",
        is_active=True,
        description=spec.get("description"),
    )


def _as_date(value: Any) -> Optional[date]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        return date.fromisoformat(value[:10])
    return None


def _as_dt(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    parsed: Optional[datetime] = None
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, date):
        parsed = datetime(value.year, value.month, value.day)
    elif isinstance(value, str):
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed is None:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _tid(params: dict) -> Optional[str]:
    value = params.get("tid") if params.get("tid") is not None else params.get("tenant_id")
    return str(value) if value is not None else None


def _slot(params: dict) -> Any:
    if params.get("slot") is not None:
        return params["slot"]
    if params.get("quota_slot") is not None:
        return params["quota_slot"]
    return params.get("slot_kind")


def _period(params: dict) -> Optional[date]:
    return _as_date(params.get("ps") if params.get("ps") is not None else params.get("period_start"))


def _kind(params: dict) -> Any:
    return params.get("kind") or params.get("k") or params.get("agent_kind")


def _job_tenant_match(row: dict, tid: str) -> bool:
    if str(row.get("tenant_id") or "") == tid:
        return True
    payload = row.get("payload") or {}
    return str(payload.get("tenant_id") or "") == tid


class QuotaStore:
    def __init__(self) -> None:
        self.plans: dict[str, dict] = {}
        self.subs: list[dict] = []
        self.topics: list[dict] = []
        self.replacements: set[str] = set()
        self.jobs: list[dict] = []
        self.posts: list[dict] = []
        self.usage: dict[tuple, int] = {}
        self.credits: dict[str, int] = {}
        self.ledger: list[dict] = []
        self.destinations: list[dict] = []
        self.action_costs: list[dict] = [
            {"action_key": "manual_post", "credits": 50, "is_active": True},
        ]
        self.sql_log: list[tuple[str, Optional[dict]]] = []
        self._job_id = 1
        self._post_id = 1

    def add_plan(self, row: dict) -> dict:
        self.plans[str(row["id"])] = dict(row)
        return row

    def add_sub(
        self,
        tenant_id: str,
        *,
        plan_id: Optional[str],
        status: str = "active",
        agent_kind: str = "post_gen",
    ) -> dict:
        row = {
            "id": str(uuid4()),
            "tenant_id": tenant_id,
            "agent_kind": agent_kind,
            "status": status,
            "plan_id": plan_id,
            "tier": "free",
        }
        self.subs.append(row)
        return row

    def add_active_topic(self, tenant_id: str, name: str = "Persona Topic") -> dict:
        self.replacements.add(tenant_id)
        row = {
            "id": len(self.topics) + 1,
            "tenant_id": tenant_id,
            "name": name,
            "is_active": True,
            "persona_generated": True,
        }
        self.topics.append(row)
        return row

    def set_usage(self, tenant_id: str, quota_slot: str, period_start: date, used: int) -> None:
        self.usage[(tenant_id, "post_gen", quota_slot, period_start)] = used

    def used(self, tenant_id: str, quota_slot: str, period_start: date) -> int:
        return int(self.usage.get((tenant_id, "post_gen", quota_slot, period_start), 0))

    def seed_tenant(
        self,
        tenant_id: str,
        plan_code: str,
        *,
        status: str = "active",
        credits: int = 100,
        with_topic: bool = True,
        topic_name: Optional[str] = None,
    ) -> dict:
        plan = plan_for_code(plan_code)
        self.add_plan(plan)
        self.add_sub(tenant_id, plan_id=plan["id"], status=status)
        self.credits[tenant_id] = credits
        if with_topic:
            self.add_active_topic(tenant_id, topic_name or f"Topic {tenant_id[-4:]}")
        return plan

    def exec(self, sql: str, params: Optional[dict] = None) -> list[dict]:
        params = dict(params or {})
        self.sql_log.append((sql, params))
        s = " ".join(sql.split()).lower()
        if "credit_action_costs" in s or re.search(r"\baction_cost\b", s):
            return self._action_costs(s, params)
        if "subscription_quota_usage" in s:
            return self._usage(s, params)
        if "agent_subscriptions" in s:
            return self._subs(s, params)
        if "subscription_plans" in s:
            return self._plans(s, params)
        if "tenant_topic_replacements" in s:
            return self._replacements(params)
        if re.search(r"\btopics\b", s):
            return self._topics(s, params)
        if re.search(r"\bjobs\b", s):
            return self._jobs(s, params)
        if re.search(r"\bposts\b", s):
            return self._posts(s, params)
        if "credit_transactions" in s:
            return self._ledger(s, params)
        if re.search(r"\btenants\b", s):
            return self._tenants(s, params)
        return []

    def _plans(self, s: str, params: dict) -> list[dict]:
        pid = params.get("id") or params.get("plan_id")
        if pid and str(pid) in self.plans:
            row = dict(self.plans[str(pid)])
            if "is_active" in s and row.get("is_active") is False:
                return []
            return [row]
        code = params.get("code")
        rows = [dict(p) for p in self.plans.values()]
        if code:
            rows = [r for r in rows if r.get("code") == code]
        return rows

    def _subs(self, s: str, params: dict) -> list[dict]:
        rows = list(self.subs)
        tid = _tid(params)
        if tid:
            rows = [r for r in rows if r.get("tenant_id") == tid]
        kind = _kind(params)
        if kind:
            rows = [r for r in rows if r.get("agent_kind") == kind]
        elif "post_gen" in s:
            rows = [r for r in rows if r.get("agent_kind") == "post_gen"]
        if "active" in s or "trialing" in s:
            rows = [r for r in rows if r.get("status") in ("active", "trialing")]
        return [dict(r) for r in rows]

    def _topics(self, s: str, params: dict) -> list[dict]:
        rows = list(self.topics)
        tid = _tid(params)
        if tid:
            rows = [r for r in rows if r.get("tenant_id") == tid]
        if "is_active" in s:
            rows = [r for r in rows if r.get("is_active") is True]
        return [dict(r) for r in rows]

    def _replacements(self, params: dict) -> list[dict]:
        tid = _tid(params) or ""
        if tid and tid in self.replacements:
            return [{"tenant_id": tid}]
        if not tid:
            return [{"tenant_id": t} for t in sorted(self.replacements)]
        return []

    def _usage_key(self, params: dict) -> Optional[tuple]:
        tid = _tid(params) or ""
        slot = _slot(params)
        period = _period(params)
        kind = _kind(params) or "post_gen"
        if not tid or not slot or period is None:
            return None
        return (tid, kind, slot, period)

    def _usage(self, s: str, params: dict) -> list[dict]:
        is_insert = bool(re.search(r"\binsert\b", s))
        is_update = bool(re.search(r"\bupdate\b", s)) and not is_insert
        key = self._usage_key(params)
        compact = s.replace(" ", "")
        if (is_insert or is_update) and key is not None:
            if "used+1" in compact or "used = used + 1" in s:
                self.usage[key] = self.usage.get(key, 0) + 1
            elif "used" in params:
                self.usage[key] = int(params["used"])
            else:
                self.usage[key] = self.usage.get(key, 0) + 1
            tid, kind, slot, period = key
            return [{
                "tenant_id": tid,
                "agent_kind": kind,
                "quota_slot": slot,
                "period_start": period,
                "used": self.usage[key],
            }]
        tid = _tid(params) or ""
        slot = _slot(params)
        period = _period(params)
        rows = []
        for (t, k, sl, p), used in self.usage.items():
            if tid and t != tid:
                continue
            if slot and sl != slot:
                continue
            if period is not None and p != period:
                continue
            rows.append({
                "tenant_id": t,
                "agent_kind": k,
                "quota_slot": sl,
                "period_start": p,
                "used": used,
            })
        return rows

    def _jobs(self, s: str, params: dict) -> list[dict]:
        is_insert = bool(re.search(r"\binsert\b", s))
        is_update = bool(re.search(r"\bupdate\b", s)) and not is_insert
        if is_insert:
            payload = params.get("payload")
            if isinstance(payload, str):
                payload = json.loads(payload)
            payload = dict(payload or {})
            for key in ("tenant_id", "agent_kind", "slot_kind", "plan_code", "tick_at"):
                if key in params and key not in payload:
                    payload[key] = params[key]
            row = {
                "id": int(params.get("id") or self._job_id),
                "type": params.get("type") or params.get("job_type") or "generate",
                "status": params.get("status") or "pending",
                "tenant_id": params.get("tenant_id") or params.get("tid") or payload.get("tenant_id"),
                "quota_slot": params.get("quota_slot") or params.get("slot") or payload.get("slot_kind"),
                "payload": payload,
                "result": params.get("result"),
                "error_message": params.get("error_message"),
            }
            self._job_id = max(self._job_id, int(row["id"]) + 1)
            self.jobs.append(row)
            return [dict(row)]
        if is_update:
            if "interval" in s and "running" in s:
                return []
            jid = params.get("id") or params.get("job_id")
            for job in self.jobs:
                if jid is not None and int(job["id"]) != int(jid):
                    continue
                if "status" in params:
                    job["status"] = params["status"]
                if "result" in params:
                    result = params["result"]
                    job["result"] = json.loads(result) if isinstance(result, str) else result
                if "error_message" in params:
                    job["error_message"] = params["error_message"]
                if "pending" in s and job.get("status") != "pending" and "status" not in params:
                    continue
                if "cast('running' as job_status)" in s or "status = 'running'" in s:
                    job["status"] = "running"
                if "cast('completed' as job_status)" in s:
                    job["status"] = "completed"
                if "cast('failed' as job_status)" in s:
                    job["status"] = "failed"
                return [dict(job)]
            return []
        rows = [dict(j) for j in self.jobs]
        rows = self._hour(rows, params)
        compact = s.replace(" ", "")
        if params.get("type") or "type='generate'" in compact or "type = 'generate'" in s:
            rows = [r for r in rows if r.get("type") == "generate"]
        slot = _slot(params)
        if slot is not None:
            rows = [
                r for r in rows
                if r.get("quota_slot") == slot
                or (r.get("payload") or {}).get("slot_kind") == slot
            ]
        if "pending" in s and "running" in s:
            rows = [r for r in rows if r.get("status") in ("pending", "running")]
        elif params.get("status"):
            rows = [r for r in rows if r.get("status") == params["status"]]
        elif "status='pending'" in compact or "status = 'pending'" in s:
            rows = [r for r in rows if r.get("status") == "pending"]
        rows = self._window(rows, params)
        if "count(*)" in compact:
            return [{"cnt": len(rows)}]
        return rows

    def _hour(self, rows: list[dict], params: dict) -> list[dict]:
        tid = _tid(params)
        if tid:
            rows = [r for r in rows if _job_tenant_match(r, tid)]
        tick = params.get("tick_at")
        if tick is not None:
            rows = [
                r for r in rows
                if str((r.get("payload") or {}).get("tick_at")) == str(tick)
            ]
        return rows

    def _window(self, rows: list[dict], params: dict) -> list[dict]:
        wstart = _as_dt(params.get("wstart"))
        wend = _as_dt(params.get("wend"))
        if wstart is None and wend is None:
            return rows
        filtered = []
        for row in rows:
            tick = _as_dt((row.get("payload") or {}).get("tick_at"))
            if tick is None:
                continue
            if wstart is not None and tick < wstart:
                continue
            if wend is not None and tick >= wend:
                continue
            filtered.append(row)
        return filtered

    def _posts(self, s: str, params: dict) -> list[dict]:
        if re.search(r"\binsert\b", s):
            row = {
                "id": int(params.get("id") or self._post_id),
                "status": params.get("status") or "draft",
                "tenant_id": params.get("tenant_id") or params.get("tid"),
                "quota_slot": params.get("quota_slot") or params.get("slot"),
                "generated_text": params.get("generated_text") or params.get("text") or "draft text",
                "image_url": params.get("image_url"),
                "linkedin_post_urn": params.get("linkedin_post_urn"),
                "topic_id": params.get("topic_id"),
            }
            self._post_id = max(self._post_id, int(row["id"]) + 1)
            self.posts.append(row)
            return [dict(row)]
        rows = [dict(p) for p in self.posts]
        tid = _tid(params)
        if tid:
            rows = [r for r in rows if r.get("tenant_id") == tid]
        slot = _slot(params)
        if slot is not None:
            rows = [r for r in rows if r.get("quota_slot") == slot]
        if "count(*)" in s.replace(" ", ""):
            return [{"cnt": len(rows)}]
        return rows

    def _tenants(self, s: str, params: dict) -> list[dict]:
        tid = str(
            params.get("id")
            or params.get("tid")
            or params.get("tenant_id")
            or TENANT_ID
        )
        if "update" in s and "credits_remaining" in s:
            if "credits_remaining" in params:
                self.credits[tid] = int(params["credits_remaining"])
        return [{"id": tid, "credits_remaining": self.credits.get(tid, 0)}]

    def _action_costs(self, s: str, params: dict) -> list[dict]:
        key = params.get("k") or params.get("action_key")
        rows = [dict(r) for r in self.action_costs]
        if key:
            rows = [r for r in rows if r.get("action_key") == key]
        if "is_active" in s:
            rows = [r for r in rows if r.get("is_active") is True]
        return rows

    def _ledger(self, s: str, params: dict) -> list[dict]:
        if re.search(r"\binsert\b", s):
            row = dict(params)
            self.ledger.append(row)
            return [row]
        return [dict(r) for r in self.ledger]
