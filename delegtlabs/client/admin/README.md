# Delegate Labs — Admin Panel

The Delegate Labs admin console, built with [Next.js 15](https://nextjs.org) (App Router), React 19, and Tailwind CSS 4. Talks to the FastAPI admin surface at `/api/admin`.

## Stack

- Next.js 15 App Router, `output: "standalone"` for lean Docker images
- Tailwind CSS 4 with the shadcn/ui "new-york" component set
- TanStack Query, TanStack Table, React Hook Form + Zod
- Recharts, Framer Motion, Radix UI primitives

## Getting started

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_ADMIN_API_URL` | Base URL of the admin API consumed by the agents module | `http://localhost:8000/api/admin` |

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production server (`next start -p 3000`)
- `npm run lint` — run ESLint

## Docker

```bash
docker build -t delegtlabs-admin \
  --build-arg NEXT_PUBLIC_ADMIN_API_URL=https://api.example.com/api/admin .
docker run -p 3000:3000 delegtlabs-admin
```

## Routes

- `/` — dashboard
- `/agents`, `/agents/[agentId]` — agent catalog & management
- `/users` — user management
- `/customers` — customer management
- `/settings` — workspace settings
