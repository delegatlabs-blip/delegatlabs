FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_WEB_API_URL=http://localhost:8000/web/api/v1
ENV VITE_WEB_API_URL=$VITE_WEB_API_URL
ENV NODE_ENV=production

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001

COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/server.cjs"]
