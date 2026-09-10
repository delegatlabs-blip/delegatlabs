"""TS-8 test helpers. Built from C-BILLING-CATALOG + C-OVERVIEW-REMOVAL + TS-8 requirements.

Does not import catalog handler implementations. HTTP tests talk to contract paths only.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.auth_context import AuthContext, get_auth_context

BACKEND_ROOT = Path(__file__).resolve().parents[1]
AGENT_ROOT = BACKEND_ROOT.parent
FRONTEND_ROOT = AGENT_ROOT / "frontend"

TENANT_ID = "11111111-1111-1111-1111-111111111111"

USER_CATALOG = "/tenant/catalog"
ADMIN_CATALOG = "/admin/catalog"
ADMIN_PLANS = "/admin/catalog/plans"
ADMIN_PACKS = "/admin/catalog/packs"
ADMIN_COSTS = "/admin/catalog/action_costs"

PLAN_KEYS = (
    "id",
    "code",
    "name",
    "description",
    "agent_kind",
    "tier",
    "price_inr_minor",
    "price_usd_minor",
    "billing_period",
    "monthly_credits",
    "rollover_months",
    "seats",
    "linkedin_accounts",
    "features",
    "badge",
    "is_active",
    "is_default",
    "sort_order",
    "created_at",
    "updated_at",
    "daily_text",
    "daily_image",
    "weekly_image",
)
QUOTA_KEYS = ("daily_text", "daily_image", "weekly_image")
FORBIDDEN_QUOTA_KEY_SUFFIX = "_posts"
PACK_KEYS = (
    "id",
    "code",
    "name",
    "description",
    "price_inr_minor",
    "price_usd_minor",
    "credits",
    "bonus_credits",
    "total_credits",
    "badge",
    "is_active",
    "sort_order",
    "created_at",
    "updated_at",
)
COST_KEYS = (
    "id",
    "action_key",
    "label",
    "description",
    "agent_kind",
    "credits",
    "is_active",
    "sort_order",
    "updated_at",
)
ENVELOPE_KEYS = {"plans", "packs", "action_costs"}
FORBIDDEN_BODY_KEYS = {
    "currency",
    "price_minor",
    "payment_intent",
    "subscription",
    "balance",
}

# C-BILLING-CATALOG §5 (locked, TS-16 AMEND)
MIGRATIONS_DIR = BACKEND_ROOT / "app" / "db" / "migrations"
MIGRATION_017 = MIGRATIONS_DIR / "017_subscription_quota.sql"
ROLLBACK_017 = BACKEND_ROOT / "app" / "db" / "rollbacks" / "017_subscription_quota_rollback.sql"
MIGRATION_019 = MIGRATIONS_DIR / "019_credit_packs_topup.sql"
ROLLBACK_019 = BACKEND_ROOT / "app" / "db" / "rollbacks" / "019_credit_packs_topup_rollback.sql"
FREE_DESCRIPTION = "1 high-quality image post per week. No expiry."
OLD_MONTHLY_CREDITS = (60, 1000, 3000, 8000)
SEED_PACK = {
    "code": "taster_100",
    "name": "Taster",
    "price_inr_minor": 10000,
    "price_usd_minor": 100,
    "credits": 200,
    "bonus_credits": 0,
    "sort_order": 10,
}
SEED_PACKS = (
    SEED_PACK,
    {
        "code": "starter_pack_200",
        "name": "Starter pack",
        "price_inr_minor": 20000,
        "price_usd_minor": 200,
        "credits": 500,
        "bonus_credits": 0,
        "sort_order": 20,
    },
    {
        "code": "growth_pack_500",
        "name": "Growth pack",
        "price_inr_minor": 50000,
        "price_usd_minor": 500,
        "credits": 1500,
        "bonus_credits": 0,
        "sort_order": 30,
    },
)
SEED_PLANS = (
    {
        "code": "free",
        "name": "Free",
        "tier": "free",
        "price_inr_minor": 0,
        "price_usd_minor": 0,
        "monthly_credits": 0,
        "daily_text": 0,
        "daily_image": 0,
        "weekly_image": 1,
        "is_default": True,
        "description": FREE_DESCRIPTION,
    },
    {
        "code": "starter",
        "name": "Starter",
        "tier": "starter",
        "price_inr_minor": 49900,
        "price_usd_minor": 499,
        "monthly_credits": 0,
        "daily_text": 1,
        "daily_image": 0,
        "weekly_image": 3,
        "is_default": False,
    },
    {
        "code": "growth",
        "name": "Growth",
        "tier": "pro",
        "price_inr_minor": 149900,
        "price_usd_minor": 1499,
        "monthly_credits": 0,
        "daily_text": 3,
        "daily_image": 2,
        "weekly_image": 0,
        "is_default": False,
    },
    {
        "code": "scale",
        "name": "Scale",
        "tier": "enterprise",
        "price_inr_minor": 399900,
        "price_usd_minor": 3999,
        "monthly_credits": 0,
        "daily_text": 20,
        "daily_image": 10,
        "weekly_image": 0,
        "is_default": False,
    },
)
SEED_COSTS = (
    {"action_key": "manual_post", "credits": 50},
    {"action_key": "text_post", "credits": 10},
    {"action_key": "image_post", "credits": 30},
)
OLD_011_PACK_CODES = ("taster_99", "creator_499", "pro_999", "agency_2499")

NOOP_TOAST = "Catalog only — billing is not charged yet."
EMPTY_PLANS = "No plans yet."
EMPTY_PACKS = "No credit packs yet."
MOCK_SUB_BANNER = "Mock UI only — no billing charged."
MOCK_CRED_BANNER = "Mock packages — purchases stay in this session only."
MOCK_USD_LABELS = ("$19/mo", "$49/mo", "$99/mo")

_DB_MODULES = (
    "app.core.database",
    "app.services.billing",
    "app.services.payments",
    "app.services.quota",
    "app.services.users",
    "app.api.endpoints.tenant",
    "app.api.endpoints.admin",
    "app.api.endpoints.billing",
)


def _now() -> str:
    return datetime(2026, 8, 31, tzinfo=timezone.utc).isoformat()


def plan_row(**overrides: Any) -> dict:
    row = {
        "id": str(uuid4()),
        "code": "qa_plan",
        "name": "QA Plan",
        "description": None,
        "agent_kind": "post_gen",
        "tier": "starter",
        "price_inr_minor": 49900,
        "price_usd_minor": 499,
        "billing_period": "monthly",
        "monthly_credits": 0,
        "daily_text": 0,
        "daily_image": 0,
        "weekly_image": 0,
        "rollover_months": 0,
        "seats": 1,
        "linkedin_accounts": 1,
        "features": "[]",
        "badge": None,
        "is_active": True,
        "is_default": False,
        "sort_order": 0,
        "created_at": _now(),
        "updated_at": _now(),
    }
    row.update(overrides)
    return row


def pack_row(**overrides: Any) -> dict:
    credits = overrides.get("credits", 200)
    bonus = overrides.get("bonus_credits", 0)
    row = {
        "id": str(uuid4()),
        "code": "qa_pack",
        "name": "QA Pack",
        "description": None,
        "price_inr_minor": 10000,
        "price_usd_minor": 100,
        "credits": credits,
        "bonus_credits": bonus,
        "badge": None,
        "is_active": True,
        "sort_order": 0,
        "created_at": _now(),
        "updated_at": _now(),
    }
    row.update(overrides)
    if "total_credits" in row:
        row.pop("total_credits")
    return row


def cost_row(**overrides: Any) -> dict:
    row = {
        "id": str(uuid4()),
        "action_key": "qa_action",
        "label": "QA action",
        "description": None,
        "agent_kind": "post_gen",
        "credits": 1,
        "is_active": True,
        "sort_order": 0,
        "updated_at": _now(),
    }
    row.update(overrides)
    return row


class CatalogStore:
    """In-memory stand-in for catalog tables. No real Postgres fixtures exist (conftest)."""

    def __init__(self) -> None:
        self.plans: dict[str, dict] = {}
        self.packs: dict[str, dict] = {}
        self.costs: dict[str, dict] = {}

    def add_plan(self, row: dict) -> dict:
        self.plans[str(row["id"])] = dict(row)
        return row

    def add_pack(self, row: dict) -> dict:
        self.packs[str(row["id"])] = dict(row)
        return row

    def add_cost(self, row: dict) -> dict:
        self.costs[str(row["id"])] = dict(row)
        return row

    def exec(self, sql: str, params: Optional[dict] = None) -> list[dict]:
        params = dict(params or {})
        s = " ".join(sql.split()).lower()
        if "subscription_plans" in s:
            return self._table(s, params, self.plans, plan_row, "code")
        if "credit_packs" in s:
            return self._table(s, params, self.packs, pack_row, "code")
        if "credit_action_costs" in s:
            return self._table(s, params, self.costs, cost_row, "action_key")
        return []

    def _table(
        self,
        s: str,
        params: dict,
        store: dict[str, dict],
        factory,
        unique_key: str,
    ) -> list[dict]:
        is_insert = bool(re.search(r"\binsert\b", s))
        is_update = bool(re.search(r"\bupdate\b", s)) and not is_insert
        if is_insert:
            return self._insert(params, store, factory, unique_key)
        if is_update:
            return self._update(s, params, store, unique_key)
        return self._select(s, params, store, unique_key)

    def _insert(self, params: dict, store: dict[str, dict], factory, unique_key: str) -> list[dict]:
        allowed = {k: v for k, v in params.items() if k != "total_credits"}
        if unique_key in allowed:
            for existing in store.values():
                if existing.get(unique_key) == allowed[unique_key]:
                    raise _UniqueConflict(f"duplicate {unique_key}")
        if allowed.get("is_default") is True:
            kind = allowed.get("agent_kind", "post_gen")
            if any(p.get("is_default") and p.get("agent_kind") == kind for p in store.values()):
                raise _DefaultConflict("uq_sub_plans_default")
        row = factory(**allowed)
        store[str(row["id"])] = row
        return [dict(row)]

    def _update(self, s: str, params: dict, store: dict[str, dict], unique_key: str) -> list[dict]:
        row = self._lookup(params, store, unique_key)
        if row is None:
            return []
        if params.get("is_default") is True:
            kind = params.get("agent_kind", row.get("agent_kind"))
            if any(
                p.get("is_default")
                and p.get("agent_kind") == kind
                and p["id"] != row["id"]
                for p in store.values()
            ):
                raise _DefaultConflict("uq_sub_plans_default")
        for k, v in params.items():
            if k in ("id", "created_at", "total_credits"):
                continue
            if k in row or k in PLAN_KEYS or k in PACK_KEYS or k in COST_KEYS:
                row[k] = v
        row["updated_at"] = _now()
        store[str(row["id"])] = row
        return [dict(row)]

    def _select(self, s: str, params: dict, store: dict[str, dict], unique_key: str) -> list[dict]:
        found = self._lookup(params, store, unique_key)
        if found is not None:
            rows = [found]
        else:
            rows = [dict(v) for v in store.values()]
        if _wants_active_only(s, params):
            rows = [r for r in rows if r.get("is_active") is True]
        if _wants_post_gen(s, params):
            rows = [r for r in rows if r.get("agent_kind") == "post_gen"]
        rows.sort(key=lambda r: (r.get("sort_order", 0), r.get("price_inr_minor", 0), r.get("action_key") or ""))
        return rows

    def _lookup(self, params: dict, store: dict[str, dict], unique_key: str) -> Optional[dict]:
        for key in (
            "id",
            "plan_id",
            "pack_id",
            "action_cost_id",
            "action_costid",
        ):
            if key in params and str(params[key]) in store:
                return store[str(params[key])]
        if unique_key in params:
            for row in store.values():
                if row.get(unique_key) == params[unique_key]:
                    return row
        return None


class _UniqueConflict(Exception):
    pass


class _DefaultConflict(Exception):
    pass


def _wants_active_only(sql: str, params: dict) -> bool:
    if params.get("is_active") is True or params.get("active_only") is True:
        return True
    if re.search(r"is_active\s*=\s*true", sql) or re.search(r"is_active\s+is\s+true", sql):
        return True
    return False


def _wants_post_gen(sql: str, params: dict) -> bool:
    if params.get("agent_kind") == "post_gen":
        return True
    return "agent_kind" in sql and "post_gen" in sql


def tenant_ctx() -> AuthContext:
    return AuthContext(
        user_id="user-tenant",
        staff_role=None,
        tenant_role="owner",
        tenant_id=TENANT_ID,
        session_id="sid-tenant",
        is_user_session=True,
    )


def staff_ctx(role: str) -> AuthContext:
    return AuthContext(
        user_id=f"staff-{role}",
        staff_role=role,
        tenant_role=None,
        tenant_id=TENANT_ID,
        session_id=f"sid-{role}",
        is_user_session=False,
    )


def _install_store(store: CatalogStore) -> list:
    async def raw(sql: str, params: Optional[dict] = None):
        try:
            return store.exec(sql, params)
        except (_UniqueConflict, _DefaultConflict):
            raise

    async def one(sql: str, params: Optional[dict] = None):
        try:
            rows = store.exec(sql, params)
        except (_UniqueConflict, _DefaultConflict):
            raise
        return rows[0] if rows else None

    started = []
    for mod in _DB_MODULES:
        try:
            imported = __import__(mod, fromlist=["execute_raw"])
        except Exception:
            continue
        if hasattr(imported, "execute_raw"):
            p = patch(f"{mod}.execute_raw", new=AsyncMock(side_effect=raw))
            p.start()
            started.append(p)
        if hasattr(imported, "execute_one_raw"):
            p = patch(f"{mod}.execute_one_raw", new=AsyncMock(side_effect=one))
            p.start()
            started.append(p)
    return started


@pytest.fixture
def catalog_store():
    store = CatalogStore()
    patches = _install_store(store)
    yield store
    for p in patches:
        p.stop()


def _make_app() -> FastAPI:
    # Import tenant + admin + billing. The full api_router pulls
    # onboarding → grok → openai, which host pytest does not install
    # (existing tests never import the full app).
    from app.api.endpoints import admin, billing, tenant

    app = FastAPI()
    app.include_router(tenant.router)
    app.include_router(admin.router)
    app.include_router(billing.router)
    return app


@pytest.fixture
def api_app(catalog_store):
    return _make_app()


@pytest.fixture
def tenant_client(catalog_store):
    c = client_as(_make_app(), tenant_ctx())
    yield c
    close_client(c)


@pytest.fixture
def tech_client(catalog_store):
    c = client_as(_make_app(), staff_ctx("tech"))
    yield c
    close_client(c)


@pytest.fixture
def finance_client(catalog_store):
    c = client_as(_make_app(), staff_ctx("finance"))
    yield c
    close_client(c)


@pytest.fixture
def support_client(catalog_store):
    c = client_as(_make_app(), staff_ctx("support"))
    yield c
    close_client(c)


@pytest.fixture
def anon_client(catalog_store):
    c = client_as(_make_app(), None, bypass=False)
    yield c
    close_client(c)


def client_as(app: FastAPI, ctx: Optional[AuthContext], *, bypass: bool = False) -> TestClient:
    from app.core.config import settings

    app.dependency_overrides.clear()
    if ctx is not None:
        async def _ctx():
            return ctx

        app.dependency_overrides[get_auth_context] = _ctx
    patches = [patch.object(settings, "DEV_AUTH_BYPASS", bypass)]
    for p in patches:
        p.start()
    client = TestClient(app)
    client._ts8_patches = patches  # type: ignore[attr-defined]
    return client


def close_client(client: TestClient) -> None:
    for p in getattr(client, "_ts8_patches", []):
        p.stop()
    client.close()


def _join_route_prefix(prefix: str, path: str) -> str:
    prefix = prefix or ""
    path = path or ""
    if not path:
        return prefix
    if not prefix:
        return path
    pref = prefix.rstrip("/")
    if not pref:
        return path
    if path == pref or path.startswith(pref + "/"):
        return path
    if path.startswith("/"):
        return pref + path
    return pref + "/" + path


def _walk_route_table(routes: Any, prefix: str, out: set[tuple[str, str]]) -> None:
    for route in routes or []:
        original = getattr(route, "original_router", None)
        if original is not None:
            nested_prefix = _join_route_prefix(prefix, getattr(original, "prefix", "") or "")
            _walk_route_table(getattr(original, "routes", None), nested_prefix, out)

        nested = getattr(route, "routes", None)
        if nested:
            _walk_route_table(nested, prefix, out)

        methods = getattr(route, "methods", None) or set()
        path = getattr(route, "path", None)
        if not path:
            continue
        full = _join_route_prefix(prefix, path)
        for method in methods:
            if method in {"HEAD", "OPTIONS"}:
                continue
            out.add((method, full))


def route_table(app: FastAPI) -> set[tuple[str, str]]:
    out: set[tuple[str, str]] = set()
    _walk_route_table(getattr(app, "routes", None), "", out)
    return out


def assert_envelope(body: dict) -> None:
    assert set(body.keys()) == ENVELOPE_KEYS
    for key in FORBIDDEN_BODY_KEYS:
        assert key not in body
    assert isinstance(body["plans"], list)
    assert isinstance(body["packs"], list)
    assert isinstance(body["action_costs"], list)


def assert_plan_shape(plan: dict) -> None:
    for key in PLAN_KEYS:
        assert key in plan, f"plan missing {key}"
    assert isinstance(plan["id"], str)
    assert isinstance(plan["price_inr_minor"], int)
    assert isinstance(plan["price_usd_minor"], int)
    assert plan["price_inr_minor"] >= 0
    assert plan["price_usd_minor"] >= 0
    assert isinstance(plan["features"], list)
    for key in QUOTA_KEYS + ("monthly_credits",):
        assert isinstance(plan[key], int), f"{key} must be int"
        assert plan[key] >= 0, f"{key} must be >= 0"
        assert f"{key}_posts" not in plan
    for key in ("currency", "price_minor"):
        assert key not in plan


def py_function_source(src: str, name: str) -> str:
    m = re.search(rf"^(async )?def {re.escape(name)}\(", src, re.M)
    if not m:
        return ""
    nxt = re.search(r"^(async )?def ", src[m.end() :], re.M)
    return src[m.start() : (m.end() + nxt.start() if nxt else len(src))]


def assert_pack_shape(pack: dict) -> None:
    for key in PACK_KEYS:
        assert key in pack, f"pack missing {key}"
    assert isinstance(pack["id"], str)
    assert pack["total_credits"] == pack["credits"] + pack["bonus_credits"]
    for key in ("currency", "price_minor", "agent_kind"):
        assert key not in pack


def assert_cost_shape(cost: dict) -> None:
    for key in COST_KEYS:
        assert key in cost, f"action_cost missing {key}"
    assert isinstance(cost["id"], str)
    assert "created_at" not in cost
    assert "price_inr_minor" not in cost
    assert "price_usd_minor" not in cost


def seed_mixed_catalog(store: CatalogStore) -> dict[str, dict]:
    active = store.add_plan(plan_row(code="active_starter", name="Starter", is_active=True, sort_order=1))
    inactive = store.add_plan(plan_row(code="inactive_plan", name="Hidden", is_active=False, sort_order=2))
    lead = store.add_plan(
        plan_row(code="lead_plan", name="Lead", agent_kind="lead_gen", is_active=True, sort_order=3)
    )
    pack_on = store.add_pack(pack_row(code="taster_100", name="Taster", is_active=True, credits=200))
    pack_off = store.add_pack(pack_row(code="taster_99", name="Old Taster", is_active=False, credits=100))
    cost_on = store.add_cost(cost_row(action_key="manual_post", credits=50, is_active=True))
    cost_off = store.add_cost(cost_row(action_key="text_regenerate", credits=1, is_active=False))
    return {
        "active": active,
        "inactive": inactive,
        "lead": lead,
        "pack_on": pack_on,
        "pack_off": pack_off,
        "cost_on": cost_on,
        "cost_off": cost_off,
    }


def load_migration_sql() -> str:
    chunks: list[str] = []
    db_root = BACKEND_ROOT / "app" / "db"
    if db_root.is_dir():
        for path in sorted(db_root.rglob("*.sql")):
            chunks.append(path.read_text())
    return "\n".join(chunks)


def read_frontend(rel: str) -> str:
    path = FRONTEND_ROOT / rel
    return path.read_text() if path.is_file() else ""


def frontend_glob(pattern: str) -> list[Path]:
    return sorted(FRONTEND_ROOT.glob(pattern))


def collect_docs_text() -> str:
    texts: list[str] = []
    skip_parts = {
        "node_modules",
        "dist",
        "build",
        ".venv",
        "vendor",
        ".pytest_cache",
        "__pycache__",
    }
    for name in ("CHANGELOG.md", "README.md", "STRUCTURE.md", "README_DOCKER.md"):
        for path in AGENT_ROOT.rglob(name):
            if any(part in skip_parts for part in path.parts):
                continue
            texts.append(path.read_text())
    return "\n".join(texts)
