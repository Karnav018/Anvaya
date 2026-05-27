# syntax=docker/dockerfile:1.7

# --- Stage 1: builder ---------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time API URL baked into the Vite bundle.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Install deps first to maximize layer cache.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source and build.
COPY . .
RUN npm run build

# --- Stage 2: runtime ---------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# SPA-aware nginx config (history fallback + cache headers).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static assets.
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
