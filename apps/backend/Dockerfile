# syntax=docker/dockerfile:1

# ---------- Base builder ----------
FROM node:20-alpine AS builder

ENV CI=true
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

WORKDIR /app

# Copy workspace manifests for better cache
COPY pnpm-workspace.yaml ./
COPY turbo.json ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy app and shared packages manifests
COPY apps/backend/package.json apps/backend/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/utils/package.json packages/utils/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json

# Install with full deps to keep drizzle-kit available for migrations
RUN pnpm install --frozen-lockfile

# Copy full repo (honors .dockerignore if present)
COPY . .

# Build only backend
RUN pnpm --filter backend... build

# ---------- Runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

WORKDIR /app

# Copy only needed runtime files from builder
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/apps/backend/package.json /app/apps/backend/package.json
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/backend/views /app/apps/backend/views
COPY --from=builder /app/apps/backend/public /app/apps/backend/public

ENV PORT=8080
EXPOSE 8080

# Default command: start the compiled server
CMD ["node", "dist/apps/backend/src/index.js"]
