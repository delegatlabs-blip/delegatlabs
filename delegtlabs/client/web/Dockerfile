FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
# Reinstall native CSS binaries for the container platform (lockfile is often macOS-only).
RUN --mount=type=cache,target=/root/.npm \
    npm ci \
 && npm install --no-save lightningcss @tailwindcss/oxide

FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_WEB_API_URL=http://localhost:8000/web/api/v1
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3001
ARG NEXT_PUBLIC_CONTACT_EMAIL=hello@delegtlabs.com
ARG NEXT_PUBLIC_PHONE_DISPLAY=+91 9307509511
ARG NEXT_PUBLIC_WHATSAPP_PHONE=919307509511
ENV NEXT_PUBLIC_WEB_API_URL=$NEXT_PUBLIC_WEB_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL \
    NEXT_PUBLIC_PHONE_DISPLAY=$NEXT_PUBLIC_PHONE_DISPLAY \
    NEXT_PUBLIC_WHATSAPP_PHONE=$NEXT_PUBLIC_WHATSAPP_PHONE \
    NEXT_TELEMETRY_DISABLED=1 \
    # Placeholder for `prisma generate` only — Compose overrides this at runtime.
    DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/delegtlabs

RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3001

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3001
CMD ["node", "server.js"]
