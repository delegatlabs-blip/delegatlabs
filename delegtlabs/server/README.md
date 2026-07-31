# DelegtLabs Server

FastAPI modular monolith with **admin**, **user**, and **web** surfaces under a scalable `app/` layout.

See [STRUCTURE.md](./STRUCTURE.md) for the full tree.

## Layout (summary)

| Path | Role |
|------|------|
| `app/main.py` | FastAPI instance, mounts routers, lifespan |
| `app/core/` | config, security (JWT + tenant claims), SQLAlchemy |
| `app/domain/tenant/` | **Common tenant helpers** — `require_tenant_id`, `apply_tenant_filter`, `stamp_tenant_id` |
| `app/models/` | ORM models (tenants, tenant_members, admin_*, …) |
| `app/schemas/` | Pydantic schemas |
| `app/api/v1/{admin,user,web}/` | Thin route handlers |
| `app/services/` | Business logic (auth issues JWT with `tenant_id`) |
| `app/repositories/` | SQLAlchemy query layer (always tenant-filtered on user surface) |
| `app/utils/` | exceptions, helpers |
| `alembic/` | Migrations |
| `tests/` | Pytest |

## Run

```bash
cd server
source .venv/bin/activate
pip install -e ".[dev]"   # or: pip install -r requirements.txt && pip install -e .
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Docker Compose (from monorepo `delegtlabs/`):

```bash
docker compose up --build
```

Entrypoint: `uvicorn app.main:app`

## Routes

```
GET  /                         # app info
GET  /health
GET  /api/admin/health
GET|POST /api/admin/agents
GET|PUT|DELETE /api/admin/agents/{id}
GET|POST /api/admin/users
GET|POST /api/admin/customers
GET  /user/api/v1/health
GET  /user/api/v1/profile/me
GET  /web/api/v1/health
GET  /web/api/v1/agents
```

## Storage

PostgreSQL via SQLAlchemy async (`DATABASE_URL`). Admin catalog tables: `admin_agents`, `admin_users`, `admin_customers`.
