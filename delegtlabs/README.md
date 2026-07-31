# DelegtLabs

Monorepo for **DelegtLabs**: modular-monolith FastAPI backend + Next.js clients.

```
delegtlabs/
├── client/
│   ├── admin/     # Internal admin console (Next.js 15)
│   ├── user/      # Product / tenant app (Next.js 15)
│   └── web/       # Marketing / marketplace site (Next.js 15)
├── packages/
│   └── agents/    # Pluggable agent packages
└── server/
    └── app/       # FastAPI monolith — admin / user / web surfaces
```

## Design goals

1. **Monolith today** — one FastAPI process via `app.main:app`.
2. **Surface isolation** — admin, user, and web routers stay separate under `app/api/v1/`.
3. **API versioning** — routes under `/api/admin`, `/user/api/v1`, `/web/api/v1`.
4. **Client isolation** — each frontend lives in its own folder for independent deploys.

## Quick start

### One-command Docker run

From this directory (`delegtlabs/`):

```bash
docker compose up --build

# Admin UI hot-reload (auto-refresh on save — no rebuild each change)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build admin
# or: ./scripts/dev-admin.sh
```

Services:

| Service | URL |
|---------|-----|
| Admin UI | http://localhost:3000 |
| Web / marketplace | http://localhost:3001 |
| User app | http://localhost:3002 |
| API docs | http://localhost:8000/docs |
| Postgres | localhost:5433 (`postgres` / `postgres`) — host port 5433 avoids clash with local Mac Postgres |
| Redis | localhost:6379 |

Notes:
- Admin JWT auth is disabled via `DISABLE_ADMIN_AUTH=true` for local Docker convenience.
- Auth is custom JWT (not Supabase Auth). Re-enable by setting `DISABLE_ADMIN_AUTH=false` and configuring `SECRET_KEY` / token settings on the server.
- Frontends are Next.js 15 (App Router). API base URLs use `NEXT_PUBLIC_*_API_URL` build args.

### Backend

```bash
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
export PYTHONPATH=.
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

- Docs: http://localhost:8000/docs
- Admin API: http://localhost:8000/api/admin

### Clients

```bash
# Admin (Next.js)
cd client/admin && cp .env.example .env && npm install && npm run dev

# Web
cd client/web && cp .env.example .env && npm install && npm run dev

# User
cd client/user && cp .env.example .env && npm install && npm run dev
```

Env vars (see each app’s `.env.example`):
- Admin: `NEXT_PUBLIC_ADMIN_API_URL` → `http://localhost:8000/api/admin`
- Web: `NEXT_PUBLIC_WEB_API_URL` → `http://localhost:8000/web/api/v1`
- User: `NEXT_PUBLIC_USER_API_URL` → `http://localhost:8000/user/api/v1`
