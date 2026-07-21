# DelegtLabs

Monorepo for **DelegtLabs**: modular-monolith FastAPI backend + separate Next.js clients.

```
delegtlabs/
├── client/
│   ├── admin/     # Next.js admin console (scaffolded)
│   ├── user/      # Product app (placeholder)
│   └── web/       # Marketing site (placeholder)
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
3. **API versioning** — routes under `/admin/api/v1`, `/user/api/v1`, `/web/api/v1`.
4. **App versioning** — `APP_VERSION` on `/version` and `X-App-Version` response headers.
5. **Client isolation** — each frontend lives in its own folder for independent deploys.

## Quick start

### One-command Docker run

```bash
docker compose up --build
# or if your Docker uses legacy CLI:
docker-compose up --build
```

Services:
- Admin UI: http://localhost:3000
- API docs: http://localhost:8000/docs
- Postgres: localhost:5432 (`postgres/postgres`)

Notes:
- For local Docker convenience, admin JWT auth is disabled via `DISABLE_ADMIN_AUTH=true` in compose.
- Re-enable auth by setting it to `false` and providing real Supabase JWT config.

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

### Admin client

```bash
cd client/admin
cp .env.example .env.local
npm install
npm run dev
```

## Extraction path

When a surface needs its own service:

1. Deploy `admin.main:app` (or user/web) alone.
2. Keep importing `shared` as a library, or copy thin adapters.
3. Point the matching client (`client/admin`, etc.) at the new host.
4. Remove that surface from `gateway/main.py`.
