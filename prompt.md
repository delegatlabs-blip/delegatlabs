# Delegtlabs Multi-Agent Platform Build Prompt

Execute phase by phase. Do not skip. Each phase ends with a working checkpoint before the next starts.

## Active agents (only these two)

The platform ships **exactly two** agent packages:

1. `packages/agents/linkedin-agent/` — LinkedIn PR posting + lead generation (logic adapted from `linkedin_pr_agent/` reference)
2. `packages/agents/lawyer-agent/` — Guided legal drafting (logic adapted from `lawyer-agent/delegatlabs-lawyer-agent/` reference)

Do **not** add facebook-ads, instagram, email, or seo agent packages. Reference repos are inspiration only — do not mount their standalone apps.

## Architecture (fixed)

Agent Plugin Registry pattern. Each agent is a self-contained package under packages/agents/{slug}/ with a manifest.json. Core platform scans this folder at boot (backend) and build time (frontend) to auto-register routes, routers, and workers.

Package shape:

```
packages/agents/{slug}/
  manifest.json
  frontend/AdminDashboard.tsx
  frontend/UserDashboard.tsx
  frontend/ConfigForm.tsx
  frontend/config-schema.ts
  backend/router_admin.py
  backend/router_user.py
  backend/models.py
  backend/schemas.py
  backend/service.py
  backend/worker.py
```

linkedin-agent also has `backend/pr_pipeline.py` (PR + lead helpers).
lawyer-agent also has `frontend/lib/` (catalog, blueprints, completeness, prompt compile).

manifest — LinkedIn:
```json
{
  "slug": "linkedin-agent",
  "name": "LinkedIn Growth Agent",
  "category": "linkedin",
  "version": "2.0.0",
  "admin_route": "/admin/agents/linkedin-agent/dashboard",
  "user_route": "/dashboard/agents/linkedin-agent",
  "worker_schedule": "0 */6 * * *",
  "capabilities": ["lead_generation", "post_generation", "pr_posting"]
}
```

manifest — Lawyer:
```json
{
  "slug": "lawyer-agent",
  "name": "Lawyer Drafting Agent",
  "category": "legal",
  "version": "1.0.0",
  "admin_route": "/admin/agents/lawyer-agent/dashboard",
  "user_route": "/dashboard/agents/lawyer-agent",
  "worker_schedule": "0 0 * * *",
  "capabilities": ["legal_drafting"]
}
```

server/shared/agent_registry.py scans packages/agents/*/manifest.json at import time, exposes get_registered_agents().

Frontend maps (manual): agent-dashboard-map.ts and agent-user-dashboard-map.ts list only linkedin-agent and lawyer-agent.

## Phase 1 -- Core shared DB schema

New tables in server/shared/db/, Alembic migration:

agent_configs -- id, client_agent_id FK, config jsonb, updated_at
agent_runs -- id, client_agent_id FK, run_type, status, started_at, finished_at, output_summary jsonb, error_message
agent_metrics_daily -- id, client_agent_id FK, metric_date, metric_name, metric_value numeric
agent_credentials -- id, client_agent_id FK, provider, encrypted_token bytea, refresh_token bytea, scopes text[], expires_at

Rule: generic tables above are for cross-agent rollups only. Each agent's own detailed tables live in that agent's backend/models.py, FK to client_agents.id.

## Phase 2 -- Admin per-agent sub-dashboard

Dynamic route client/admin/.../agents/[slug]/dashboard loads AdminDashboard via agent-dashboard-map.ts.
LinkedIn admin: customers, MRR, runs, 30d metrics, error rate.
Lawyer admin: clients, draft runs, 30d draft metrics, error rate.

## Phase 3 -- User panel

Global dashboard cards for purchased agents (LinkedIn + Lawyer).
Per-agent pages load UserDashboard + ConfigForm via agent-user-dashboard-map.ts.

LinkedIn tabs: config (lead + PR/post), leads stats, posts stats.
Lawyer tabs: config, draft catalog → intake → generate → preview.

## Phase 4 -- Web purchase flow

Pricing catalog exposes only linkedin-agent and lawyer-agent.
Stripe checkout creates client_agents for selected slugs.

## Phase 5 -- LinkedIn worker

Arq + Redis. linkedin-agent worker runs PR pipeline (RSS → LLM copy → image → publish/draft) and lead pipeline (search → score → store), mocked when API keys missing. Writes agent_runs + agent_metrics_daily.

## Phase 6 -- (retired)

Previously replicated facebook/instagram/email/seo. Those agents are removed. Skip this phase.

## Phase 7 -- Reference agent ports (current)

### 7a LinkedIn PR upgrade
Port from linkedin_pr_agent: topic weights, news search, content generation, lead search, OAuth connect. Mock when keys absent.

### 7b Lawyer agent
Port guided drafting from lawyer reference with mock AI default. Request-driven generate-draft API. Worker is metrics rollup only.

## Build order

1. Phases 1–5 (platform + LinkedIn baseline)
2. Phase 7a LinkedIn PR upgrade
3. Phase 7b Lawyer agent + maps + worker generic dispatch
4. Remove any non-LinkedIn/non-Lawyer agent packages; catalog and seeded dashboards show only these two

Checkpoint: get_registered_agents() returns exactly linkedin-agent and lawyer-agent; admin/user dashboards work for both; Phase 7 tests pass.
