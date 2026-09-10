# LinkedIn Content Agent — Docker Setup

Run the FastAPI backend and React frontend with Postgres.

## Quick start (from monorepo root)

```bash
docker compose up --build linkedin-backend linkedin-frontend
```

Or full stack:

```bash
docker compose up --build
```

## Standalone (from this package)

```bash
docker compose up --build
```

## Ports

| Service | Port | URL |
|---|---|---|
| Frontend | **3005** | http://localhost:3005 |
| Backend | **8005** | http://localhost:8005 |
| Health | **8005** | http://localhost:8005/health |

In the monorepo Compose file, backend uses the shared `db` service and creates database `linkedin_agent` on first start.

Post Gen subscription generate uses the existing in-process backend scheduler. `DISABLE_SCHEDULER=true` skips it.
