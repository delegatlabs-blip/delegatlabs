FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_USER_API_URL=http://localhost:8000/user/api/v1
ENV VITE_USER_API_URL=$VITE_USER_API_URL
ENV NITRO_PRESET=node-server

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3002

COPY --from=builder /app/.output ./.output

EXPOSE 3002
CMD ["node", ".output/server/index.mjs"]
