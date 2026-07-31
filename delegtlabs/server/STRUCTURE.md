# Server layout

```
server/
├── app/
│   ├── main.py
│   ├── domain/
│   │   └── tenant/             # require_tenant_id, apply_tenant_filter, stamp_tenant_id
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py         # JWT with tenant_id claim
│   │   ├── database.py
│   │   └── …
│   ├── models/
│   │   ├── tenant.py
│   │   ├── tenant_member.py
│   │   └── …
│   ├── api/v1/user/
│   │   └── endpoints/          # auth, members, profile (all tenant-scoped)
│   ├── services/
│   ├── repositories/
│   └── utils/
├── alembic/
└── …
```

## Run

```bash
cd server
source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Docker: `uvicorn app.main:app` (see Dockerfile).
