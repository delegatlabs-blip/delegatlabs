# Delegtlabs — Project Structure

Folder and file tree for `delegtlabs/` (excluding `node_modules`, `.next`, `.git`, caches, and build artifacts).

```
delegtlabs/
├── delegtlabs/
│   ├── client/
│   │   ├── admin/
│   │   │   ├── public/
│   │   │   │   ├── file.svg
│   │   │   │   ├── globe.svg
│   │   │   │   ├── next.svg
│   │   │   │   ├── vercel.svg
│   │   │   │   └── window.svg
│   │   │   ├── src/
│   │   │   │   ├── app/
│   │   │   │   │   ├── admin/
│   │   │   │   │   │   ├── agents/
│   │   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── audit-log/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── clients/
│   │   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── plans/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── layout.tsx
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── favicon.ico
│   │   │   │   │   ├── globals.css
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── temp.js
│   │   │   │   ├── components/
│   │   │   │   │   ├── admin/
│   │   │   │   │   │   ├── AdminNavbar.tsx
│   │   │   │   │   │   ├── AgentCard.tsx
│   │   │   │   │   │   └── PageHeader.tsx
│   │   │   │   │   └── ui/
│   │   │   │   │       ├── Badge.tsx
│   │   │   │   │       ├── Card.tsx
│   │   │   │   │       └── Charts.tsx
│   │   │   │   └── lib/
│   │   │   │       └── api.ts
│   │   │   ├── .dockerignore
│   │   │   ├── .env.example
│   │   │   ├── .env.local
│   │   │   ├── .gitignore
│   │   │   ├── AGENTS.md
│   │   │   ├── CLAUDE.md
│   │   │   ├── Dockerfile
│   │   │   ├── eslint.config.mjs
│   │   │   ├── next-env.d.ts
│   │   │   ├── next.config.ts
│   │   │   ├── package-lock.json
│   │   │   ├── package.json
│   │   │   ├── postcss.config.mjs
│   │   │   ├── README.md
│   │   │   └── tsconfig.json
│   │   ├── user/
│   │   │   └── README.md
│   │   ├── web/
│   │   │   └── README.md
│   │   └── package-lock.json
│   ├── server/
│   │   ├── admin/
│   │   │   ├── api/
│   │   │   │   ├── v1/
│   │   │   │   │   ├── endpoints/
│   │   │   │   │   │   ├── __init__.py
│   │   │   │   │   │   ├── agents.py
│   │   │   │   │   │   ├── audit_log.py
│   │   │   │   │   │   ├── clients.py
│   │   │   │   │   │   ├── health.py
│   │   │   │   │   │   ├── plans.py
│   │   │   │   │   │   └── subscriptions.py
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   └── router.py
│   │   │   │   └── __init__.py
│   │   │   ├── modules/
│   │   │   │   ├── audit_logs/
│   │   │   │   ├── auth/
│   │   │   │   ├── platform/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── audit.py
│   │   │   │   │   ├── models.py
│   │   │   │   │   ├── schemas.py
│   │   │   │   │   └── security.py
│   │   │   │   ├── roles/
│   │   │   │   ├── tenants/
│   │   │   │   │   └── __init__.py
│   │   │   │   ├── users/
│   │   │   │   └── __init__.py
│   │   │   ├── tests/
│   │   │   │   ├── e2e/
│   │   │   │   ├── integration/
│   │   │   │   └── unit/
│   │   │   ├── __init__.py
│   │   │   └── main.py
│   │   ├── alembic/
│   │   │   ├── versions/
│   │   │   │   └── 20260708_01_admin_panel_init.py
│   │   │   ├── env.py
│   │   │   └── script.py.mako
│   │   ├── gateway/
│   │   │   ├── __init__.py
│   │   │   └── main.py
│   │   ├── scripts/
│   │   │   └── dev.sh
│   │   ├── shared/
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── config.py
│   │   │   │   ├── exceptions.py
│   │   │   │   ├── logging.py
│   │   │   │   ├── middleware.py
│   │   │   │   └── security.py
│   │   │   ├── db/
│   │   │   │   ├── migrations/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   └── session.py
│   │   │   ├── dependencies/
│   │   │   │   ├── __init__.py
│   │   │   │   └── settings.py
│   │   │   ├── enums/
│   │   │   │   ├── __init__.py
│   │   │   │   └── surfaces.py
│   │   │   ├── integrations/
│   │   │   │   ├── ai_providers/
│   │   │   │   │   └── __init__.py
│   │   │   │   ├── email/
│   │   │   │   │   └── __init__.py
│   │   │   │   ├── storage/
│   │   │   │   │   └── __init__.py
│   │   │   │   ├── supabase/
│   │   │   │   │   └── __init__.py
│   │   │   │   └── __init__.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   └── common.py
│   │   │   ├── utils/
│   │   │   │   ├── __init__.py
│   │   │   │   └── strings.py
│   │   │   └── __init__.py
│   │   ├── tests/
│   │   │   └── test_gateway.py
│   │   ├── user/
│   │   │   ├── api/
│   │   │   │   ├── v1/
│   │   │   │   │   ├── endpoints/
│   │   │   │   │   │   ├── __init__.py
│   │   │   │   │   │   ├── health.py
│   │   │   │   │   │   └── profile.py
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   └── router.py
│   │   │   │   └── __init__.py
│   │   │   ├── modules/
│   │   │   │   ├── agents/
│   │   │   │   │   └── __init__.py
│   │   │   │   ├── auth/
│   │   │   │   │   └── __init__.py
│   │   │   │   ├── documents/
│   │   │   │   │   └── __init__.py
│   │   │   │   ├── profile/
│   │   │   │   │   └── __init__.py
│   │   │   │   ├── projects/
│   │   │   │   │   └── __init__.py
│   │   │   │   ├── tasks/
│   │   │   │   │   └── __init__.py
│   │   │   │   └── __init__.py
│   │   │   ├── tests/
│   │   │   │   ├── e2e/
│   │   │   │   ├── integration/
│   │   │   │   └── unit/
│   │   │   ├── __init__.py
│   │   │   └── main.py
│   │   ├── web/
│   │   │   ├── api/
│   │   │   │   ├── v1/
│   │   │   │   │   ├── endpoints/
│   │   │   │   │   │   ├── __init__.py
│   │   │   │   │   │   ├── health.py
│   │   │   │   │   │   └── public.py
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   └── router.py
│   │   │   │   └── __init__.py
│   │   │   ├── modules/
│   │   │   │   ├── contact/
│   │   │   │   │   └── __init__.py
│   │   │   │   ├── content/
│   │   │   │   │   └── __init__.py
│   │   │   │   ├── public/
│   │   │   │   │   └── __init__.py
│   │   │   │   └── __init__.py
│   │   │   ├── tests/
│   │   │   │   ├── e2e/
│   │   │   │   ├── integration/
│   │   │   │   └── unit/
│   │   │   ├── __init__.py
│   │   │   └── main.py
│   │   ├── .dockerignore
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── .gitignore
│   │   ├── alembic.ini
│   │   ├── Dockerfile
│   │   ├── pyproject.toml
│   │   └── README.md
│   ├── .gitignore
│   ├── docker-compose.yml
│   └── README.md
└── STRUCTURE.md
```

## Notes

- **client/** — Frontends (`admin`, `user`, `web`)
- **server/** — Backend surfaces (`admin`, `user`, `web`), shared libs, gateway, alembic
- Generated / dependency dirs are omitted from this tree
