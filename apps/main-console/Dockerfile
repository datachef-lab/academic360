# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-alpine AS builder
ENV CI=true
ARG VITE_APP_BACKEND_URL
ARG VITE_APP_PREFIX
ARG VITE_STUDENT_PROFILE_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_APP_BACKEND_URL=$VITE_APP_BACKEND_URL
ENV VITE_APP_PREFIX=$VITE_APP_PREFIX
ENV VITE_STUDENT_PROFILE_URL=$VITE_STUDENT_PROFILE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY turbo.json ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY apps/main-console/package.json apps/main-console/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json

RUN pnpm install --frozen-lockfile

COPY . .

# Build only required shared packages before main-console build (after sources copied)
RUN pnpm --filter @repo/db... build || (cd packages/db && pnpm run build)

# Build only main-console
RUN pnpm --filter main-console... build

# ---------- Nginx runtime ----------
FROM nginx:1.27-alpine AS runtime

# Copy built static assets from builder
COPY --from=builder /app/apps/main-console/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
