# Admin + Web APIs (Supabase)

## Run (monolith gateway)

```bash
cd delegtlabs/server
source .venv/bin/activate   # or create venv
uvicorn gateway.main:app --reload --port 8000
```

- Admin: `http://localhost:8000/api/admin`
- Web: `http://localhost:8000/web/api/v1`
- Docs: `http://localhost:8000/docs`

## Supabase

1. Create a Supabase project.
2. Run SQL in `supabase/migrations/001_agents_users_customers.sql`.
3. Set in `.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
DISABLE_ADMIN_AUTH=true
```

If keys are empty, APIs use an **in-memory fallback** (seeded LinkedIn + Lawyer agents).

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
