# DelegtLabs Admin Client

Next.js app for the administration console.

## Run

```bash
cd client/admin
cp .env.example .env.local
npm install
npm run dev
```

Opens on http://localhost:3000 — expects the monolith API on http://localhost:8000.

## Layout

This folder is self-contained so it can move to its own repo/deployment later.
Keep admin-only UI, API clients, and env here — never mix with `client/user` or `client/web`.
