# Graph Report - server  (2026-07-28)

## Corpus Check
- 72 files · ~8,266 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 327 nodes · 693 edges · 31 communities (25 shown, 6 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b3aac84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- agent_repository.py
- user_repository.py
- customer_repository.py
- get_registered_agents
- get_session_factory
- HTTPException
- DelegtLabs Server
- HealthResponse
- Admin + Web APIs (PostgreSQL)
- dev.sh
- Server layout
- core/__init__.py
- app/__init__.py
- integrations/__init__.py
- delegtlabs-server

## God Nodes (most connected - your core abstractions)
1. `get_session_factory()` - 25 edges
2. `AgentRecord` - 18 edges
3. `CustomerRecord` - 17 edges
4. `UserRecord` - 17 edges
5. `get_registered_agents()` - 16 edges
6. `Base` - 15 edges
7. `AgentRepository` - 15 edges
8. `CustomerRepository` - 14 edges
9. `UserRepository` - 14 edges
10. `row_to_agent()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `test_lawyer_manifest_legal_drafting()` --calls--> `get_registered_agents()`  [EXTRACTED]
  tests/test_phase7_reference_agents.py → app/agent_registry.py
- `test_linkedin_manifest_has_pr_capability()` --calls--> `get_registered_agents()`  [EXTRACTED]
  tests/test_phase7_reference_agents.py → app/agent_registry.py
- `test_agent_registry_empty_or_valid()` --calls--> `get_registered_agents()`  [EXTRACTED]
  tests/test_agent_registry.py → app/agent_registry.py
- `test_active_agents_auto_discovered()` --calls--> `get_registered_agents()`  [EXTRACTED]
  tests/test_phase6_replication.py → app/agent_registry.py
- `test_reference_agents_registered()` --calls--> `get_registered_agents()`  [EXTRACTED]
  tests/test_phase7_reference_agents.py → app/agent_registry.py

## Import Cycles
- None detected.

## Communities (31 total, 6 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.05
Nodes (32): get_current_settings(), health(), get, get_me(), ProfileRead, BaseModel, get, health() (+24 more)

### Community 1 - "agent_repository.py"
Cohesion: 0.13
Nodes (28): create_agent(), post, put, update_agent(), AdminAgent, Admin console agent catalog (listing + runtime config)., AgentRepository, _apply_row() (+20 more)

### Community 2 - "user_repository.py"
Cohesion: 0.14
Nodes (24): create_user(), get_user(), list_users(), get, post, put, update_user(), AdminUser (+16 more)

### Community 3 - "customer_repository.py"
Cohesion: 0.14
Nodes (24): create_customer(), get_customer(), list_customers(), get, post, put, update_customer(), AdminCustomer (+16 more)

### Community 4 - "get_registered_agents"
Cohesion: 0.12
Nodes (21): AgentRegistry, _find_agents_dir(), get_agent_manifest(), get_registered_agents(), get_worker_entrypoints(), Any, get_user_global_dashboard(), list_registered_agents() (+13 more)

### Community 5 - "get_session_factory"
Cohesion: 0.14
Nodes (19): Base, get_db(), get_engine(), get_session_factory(), AsyncSession, SQLAlchemy engine, session factory, Base, get_db()., Declarative base for all ORM models., Clear cached engine/session (useful for tests). (+11 more)

### Community 6 - "HTTPException"
Cohesion: 0.14
Nodes (14): delete_agent(), get_agent(), list_agents(), delete, get, delete_customer(), delete, delete_user() (+6 more)

### Community 7 - "DelegtLabs Server"
Cohesion: 0.25
Nodes (7): DelegtLabs Server, Folder map, Quick start, Routes (monolith), Run a single surface, Versioning, Why this layout

### Community 8 - "HealthResponse"
Cohesion: 0.38
Nodes (5): api_health(), get, APIModel, HealthResponse, BaseModel

### Community 9 - "Admin + Web APIs (PostgreSQL)"
Cohesion: 0.29
Nodes (6): Admin (`/api/admin`), Admin + Web APIs (PostgreSQL), Endpoints, PostgreSQL, Run (monolith gateway), Web (`/web/api/v1`)

## Knowledge Gaps
- **14 isolated node(s):** `delegtlabs-server`, `dev.sh script`, `PYTHONPATH`, `Why this layout`, `Versioning` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_session_factory()` connect `get_session_factory` to `agent_repository.py`, `user_repository.py`, `customer_repository.py`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `get_registered_agents()` connect `get_registered_agents` to `main.py`, `get_session_factory`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `Base` connect `get_session_factory` to `agent_repository.py`, `user_repository.py`, `customer_repository.py`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `AgentRecord` (e.g. with `AgentRepository` and `AgentService`) actually correct?**
  _`AgentRecord` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `CustomerRecord` (e.g. with `CustomerRepository` and `CustomerService`) actually correct?**
  _`CustomerRecord` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `UserRecord` (e.g. with `UserRepository` and `UserService`) actually correct?**
  _`UserRecord` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `delegtlabs-server`, `dev.sh script`, `PYTHONPATH` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._