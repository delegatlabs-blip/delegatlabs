# DelegtLabs Server

Modular monolith FastAPI backend with **three extractable surfaces**: `admin`, `user`, and `web`.

## Why this layout

| Layer | Role |
|-------|------|
| `gateway/` | Single process that mounts all surfaces (today) |
| `admin/`, `user/`, `web/` | Independent domain packages with own `api/`, `modules/`, `tests/` |
| `shared/` | Kernel (config, db, security, integrations) shared until extraction |

When you split to microservices: deploy each surface's `main.py`, keep `shared` as a package (or duplicate thin adapters), and retire `gateway/`.

## Versioning

| Kind | Source | How clients see it |
|------|--------|--------------------|
| **App version** | `APP_VERSION` / `settings.app_version` | `/version`, `X-App-Version` header |
| **API version** | `API_VERSION` / URL prefix | `/api/admin/...`, `X-API-Version` header |

Bump `APP_VERSION` for product releases. Introduce `api/v2/` routers when breaking HTTP contracts.

## Routes (monolith)

```
GET  /                         # gateway info
GET  /health
GET  /version
GET  /api/admin/health
GET  /api/admin/agents
GET  /api/admin/plans
GET  /api/admin/users
GET  /api/admin/customers
GET  /user/api/v1/health
GET  /user/api/v1/profile/me
GET  /web/api/v1/health
GET  /web/api/v1/public/meta
```

## Quick start

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
export PYTHONPATH=.
uvicorn gateway.main:app --reload --port 8000
```

Or: `bash scripts/dev.sh`

Docs: http://localhost:8000/docs

## Run a single surface

```bash
uvicorn admin.main:app --reload --port 8001
uvicorn user.main:app --reload --port 8002
uvicorn web.main:app --reload --port 8003
```

## Folder map

```
server/
├── gateway/main.py          # monolith entry
├── shared/                  # kernel
│   ├── core/                # config, security, middleware, …
│   ├── db/
│   ├── schemas/, enums/, utils/, dependencies/
│   └── integrations/
├── admin/                   # admin surface
│   ├── main.py
│   ├── api/v1/
│   ├── modules/
│   └── tests/
├── user/                    # user surface
├── web/                     # public web surface
├── alembic/
├── scripts/
├── pyproject.toml
└── .env.example
```
