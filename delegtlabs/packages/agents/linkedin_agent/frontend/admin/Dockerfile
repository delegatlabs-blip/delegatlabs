FROM node:22-alpine AS build
WORKDIR /app
# Install at /app so both ./admin and ./shared resolve the same node_modules
COPY admin/package.json admin/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY shared ./shared
COPY admin ./admin
WORKDIR /app/admin
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/admin/dist /usr/share/nginx/html
EXPOSE 3006
