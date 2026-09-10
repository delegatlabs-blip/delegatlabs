FROM node:22-alpine AS build
WORKDIR /app
# Install at /app so both ./user and ./shared resolve the same node_modules
COPY user/package.json user/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY shared ./shared
COPY user ./user
WORKDIR /app/user
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY user/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/user/dist /usr/share/nginx/html
EXPOSE 3005
