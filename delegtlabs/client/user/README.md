# DelegtLabs — User App (Next.js)

Tenant-scoped product console built with **domain-driven** layers.

## Architecture

```
src/
├── lib/
│   ├── api.ts           # shared userRequest HTTP client
│   └── domains/         # auth, member (controllers / services / utils / types)
├── components/          # presentation
├── store/               # UI-only state (theme, command palette)
└── app/                 # Next.js routes (/login, /register, /users, …)
```

## Tenant model

1. **Register / login** → server issues a JWT with `tenant_id`.
2. **Every request** sends `Authorization: Bearer <token>`.
3. **Server** extracts `tenant_id` and runs CRUDs through:
   - `require_tenant_id(ctx)`
   - `apply_tenant_filter(stmt, Model, tenant_id)`
   - `stamp_tenant_id(values, tenant_id)` on creates
4. **Client** fails fast via `requireTenantId` / `requireSessionTenantId` before calling the API.

Never send `tenant_id` in request bodies for scoping — the server always overwrites it from the JWT.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3002

| Env | Purpose |
| --- | --- |
| `NEXT_PUBLIC_USER_API_URL` | User API base (`…/user/api/v1`) |
| `NEXT_PUBLIC_DISABLE_USER_AUTH` | Skip client auth gate (Docker demo; server uses demo tenant) |

## Auth flow

- `/register` — creates tenant + owner, stores JWT
- `/login` — issues JWT with that user's `tenant_id`
- `/users` — lists/creates members scoped to the JWT tenant
