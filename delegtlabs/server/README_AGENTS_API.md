# Admin + Web APIs (PostgreSQL)

## Run (monolith gateway)

```bash
cd delegtlabs/server
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Or via Docker Compose (runs migrations on start):

```bash
cd delegtlabs
docker compose up --build
```

- Admin: `http://localhost:8000/api/admin`
- Web: `http://localhost:8000/web/api/v1`
- Docs: `http://localhost:8000/docs`

## PostgreSQL

Set in `.env` / compose:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/delegtlabs
```

In Docker Compose the host is `db` instead of `localhost`.

Admin catalog tables (migration `20260727_03`):

- `admin_agents`
- `admin_users`
- `admin_customers`

## Endpoints

### Admin (`/api/admin`)
- `GET/POST /agents`
- `GET/PUT/DELETE /agents/{id}`
- `GET/POST /users`
- `GET/PUT/DELETE /users/{id}`
- `GET/POST /customers`
- `GET/PUT/DELETE /customers/{id}`

### Web (`/web/api/v1`)
- `GET /agents` — listed + active only
- `GET /agents/{id|slug}`
