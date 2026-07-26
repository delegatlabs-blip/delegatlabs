# DelegtLabs

Monorepo for **DelegtLabs**: modular-monolith FastAPI backend + separate Vite clients.

```
delegtlabs/
├── client/
│   ├── admin/     # Admin console (TanStack Start)
│   ├── user/      # Product app (TanStack Start)
│   └── web/       # Marketing / marketplace site
├── packages/
│   └── agents/    # Pluggable agent packages
└── server/
    ├── gateway/   # Monolith entry — mounts all surfaces
    ├── shared/    # Kernel (config, db, security, integrations)
    ├── admin/     # Admin API surface
    ├── user/      # User API surface
    └── web/       # Public web API surface
```

## Design goals

1. **Monolith today** — one FastAPI process via `gateway/`.
2. **Microservice-ready** — `admin/`, `user/`, `web/` are isolated packages (own routers, modules, tests, `main.py`).
3. **API versioning** — routes under `/api/admin`, `/user/api/v1`, `/web/api/v1`.
4. **App versioning** — `APP_VERSION` on `/version` and `X-App-Version` response headers.
5. **Client isolation** — each frontend lives in its own folder for independent deploys.

## Quick start

### One-command Docker run

From this directory (`delegtlabs/`):

```bash
docker compose up --build
```

Services:

| Service | URL |
|---------|-----|
| Admin UI | http://localhost:3000 |
| Web / marketplace | http://localhost:3001 |
| User app | http://localhost:3002 |
| API docs | http://localhost:8000/docs |
| Postgres | localhost:5432 (`postgres` / `postgres`) |
| Redis | localhost:6379 |

Optional: set `GEMINI_API_KEY` in the environment (or a `.env` next to this compose file) for the web app's agent invoke endpoint.

Notes:
- Admin JWT auth is disabled via `DISABLE_ADMIN_AUTH=true` for local Docker convenience.
- Re-enable auth by setting it to `false` and providing real Supabase JWT config.
- Stop with `Ctrl+C`, or run detached: `docker compose up --build -d`.

### Backend

```bash
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
export PYTHONPATH=.
uvicorn gateway.main:app --reload --port 8000
```

- Docs: http://localhost:8000/docs
- Version: http://localhost:8000/version

### Clients

```bash
# Admin
cd client/admin && cp .env.example .env && npm install && npm run dev

# Web
cd client/web && cp .env.example .env && npm install && npm run dev

# User
cd client/user && npm install && npm run dev
```

## Extraction path

When a surface needs its own service:

1. Deploy `admin.main:app` (or user/web) alone.
2. Keep importing `shared` as a library, or copy thin adapters.
3. Point the matching client (`client/admin`, etc.) at the new host.
4. Remove that surface from `gateway/main.py`.
