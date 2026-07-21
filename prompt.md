# Delegtlabs Multi-Agent Platform Build Prompt

Execute phase by phase. Do not skip. Each phase ends with a working checkpoint before the next starts.

## Architecture (fixed)

Agent Plugin Registry pattern. Each agent is a self-contained package under packages/agents/{slug}/ with a manifest.json. Core platform scans this folder at boot (backend) and build time (frontend) to auto-register routes, routers, and workers. Adding a new agent means dropping a new folder, zero core code edits.

Folder additions:

packages/agents/linkedin-agent/
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

Repeat same shape for facebook-ads-agent, instagram-agent, email-agent, seo-agent.

manifest.json shape:
{
  "slug": "linkedin-agent",
  "name": "LinkedIn Growth Agent",
  "category": "linkedin",
  "version": "1.0.0",
  "admin_route": "/admin/agents/linkedin-agent",
  "user_route": "/dashboard/agents/linkedin-agent",
  "worker_schedule": "0 */6 * * *",
  "capabilities": ["lead_generation", "post_generation"]
}

server/shared/agent_registry.py scans packages/agents/*/manifest.json at import time, exposes get_registered_agents().

## Phase 1 -- Core shared DB schema

New tables in server/shared/db/, Alembic migration:

agent_configs -- id, client_agent_id FK, config jsonb, updated_at
agent_runs -- id, client_agent_id FK, run_type, status, started_at, finished_at, output_summary jsonb, error_message
agent_metrics_daily -- id, client_agent_id FK, metric_date, metric_name, metric_value numeric
agent_credentials -- id, client_agent_id FK, provider, encrypted_token bytea, refresh_token bytea, scopes text[], expires_at

Rule: generic tables above are for cross-agent rollups only. Each agent's own detailed tables (linkedin_leads, linkedin_posts, etc) live in that agent's own backend/models.py, FK to client_agents.id.

Checkpoint: pytest passes, agent_registry.get_registered_agents() returns empty list without error (no agent packages yet).

## Phase 2 -- Admin per-agent sub-dashboard

client/admin/src/app/admin/agents/[slug]/dashboard/page.tsx (new route):
- fetch agent_registry entry for slug
- dynamically render that agent's AdminDashboard.tsx via a build-time generated resolver map (agent-dashboard-map.ts listing slug -> import())
- wrap with AdminNavbar + breadcrumb back to /admin/agents

AgentCard.tsx: card click now routes to /admin/agents/{slug}/dashboard. Keep Edit/Deactivate as small buttons with stopPropagation so they still open the existing edit modal instead of navigating.

LinkedIn AdminDashboard.tsx shows:
- active customer count on this agent
- MRR attributed to this agent
- last 20 agent_runs with status/duration/errors
- agent_metrics_daily chart, 30 days, recharts
- error rate widget (failed/total, last 7 days)
- link to Clients list pre-filtered to this agent

Backend: packages/agents/linkedin-agent/backend/router_admin.py exposes GET /api/admin/agents/linkedin-agent/stats aggregating from agent_runs + agent_metrics_daily. Mount all agent admin routers in server/admin/api/v1/router.py by looping agent_registry.get_registered_agents().

Checkpoint: clicking LinkedIn card opens its own dashboard with seeded fake data rendering correctly.

## Phase 3 -- User panel, global + per-agent

client/user/src/app/dashboard/page.tsx:
- cards for every agent this client purchased (client_agents where client_id=me)
- total spend, plan name, renewal date
- aggregate strip: total leads + total posts across ALL agents, summed from agent_metrics_daily grouped by client only -- no per-agent code needed here, this is the payoff of the generic table
- Add another agent CTA to purchase flow

client/user/src/app/dashboard/agents/[slug]/page.tsx:
- same dynamic-import pattern as Phase 2, loads that agent's UserDashboard.tsx + ConfigForm.tsx
- LinkedIn UserDashboard.tsx tabs:
  - Lead Gen Config: target job titles, industries, company size, connection message template, daily connection cap
  - Post Agent Config: content pillars, tone, posting frequency, approval mode (auto-publish vs review-first)
  - Stats: Leads -- table, source, status, best-performing criteria
  - Stats: Posts -- table, engagement metrics, best performing post highlighted

Config form posts to POST /api/user/agents/linkedin-agent/config, agent's own Pydantic schema validates before writing into agent_configs.config jsonb.

Backend server/user/: generic POST /api/user/agents/{slug}/config routes through agent_registry to the right agent's service.py. GET /api/user/agents/{slug}/stats mounted same loop pattern as Phase 2. OAuth: GET /api/user/agents/{slug}/connect and /callback, storing encrypted token in agent_credentials.

Checkpoint: seeded test user sees global dashboard with 2 fake agents, opens LinkedIn agent, fills config form, reloads, values persist.

## Phase 4 -- Web purchase flow

client/web/src/app/pricing/page.tsx: plan cards + agent add-on grid from agent_catalog where status=active (public read-only endpoint).

client/web/src/app/checkout/page.tsx: Stripe Checkout, on success webhook creates/attaches client, creates client_subscriptions and/or client_agents rows, sends welcome email linking to client/user login.

server/web/modules/public/: POST /api/web/checkout/session, POST /api/web/checkout/webhook with Stripe signature verification.

First login: any purchased agent with no agent_credentials row shows a Connect account banner blocking its config tab until OAuth completes.

Checkpoint: buy LinkedIn agent through Stripe test mode end to end, land in user dashboard, see Connect account prompt.

## Phase 5 -- Worker, agent actually runs

Add Arq (async-native, fits FastAPI stack) + Redis to docker-compose.yml.

packages/agents/linkedin-agent/backend/worker.py, scheduled per manifest worker_schedule:
- for each active client_agents row for this agent: load agent_configs.config, load + decrypt agent_credentials (refresh if expired)
- if approval_mode is auto: generate and publish directly via LinkedIn API
- else: generate, save as draft, notify user for approval
- write result to agent_runs, upsert today's agent_metrics_daily

agent_registry.py also exposes get_worker_entrypoints() so one worker_main.py can start all agents in dev, or one container per agent in prod using AGENT_SLUG env var.

Checkpoint: manually trigger LinkedIn worker for seeded client, confirm agent_runs row created, agent_metrics_daily incremented, visible immediately on both Phase 2 admin dashboard and Phase 3 user dashboard with zero extra code -- this proves the generic rollup design works.

## Phase 6 -- Replicate for remaining agents

Copy linkedin-agent/ folder for facebook-ads-agent, instagram-agent, email-agent, seo-agent. Swap manifest.json fields, ConfigForm.tsx fields per agent (ad budget/ROAS for Facebook, content pillars for Instagram, list source for Email, keyword list for SEO), models.py tables, and worker.py external API calls. No core platform code touched -- agent_registry auto-discovers new folders on restart.

## Build order

1. Phase 1, commit
2. Phase 2, LinkedIn only, seeded data, commit
3. Phase 3, LinkedIn only, commit
4. Phase 4, Stripe test mode, commit
5. Phase 5, LinkedIn only, feature-flagged real or mocked API calls, commit
6. Phase 6, one agent at a time, commit per agent

Do not start Phase 3 before Phase 2 checkpoint passes. Do not start Phase 6 before Phase 5 checkpoint passes for LinkedIn -- Phase 6 is pure replication, only safe once the pattern is proven once end to end.