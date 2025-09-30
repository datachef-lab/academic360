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

# Build only required shared packages to satisfy backend imports (now that sources exist)
RUN pnpm --filter @repo/db... build || (cd packages/db && pnpm run build)

# Build DB package explicitly before backend
RUN pnpm -C packages/db build && pnpm --filter backend... build

# Normalize build output location to /app/dist so runtime stage can COPY consistently
# Some setups may emit to apps/backend/dist; unify to /app/dist if needed
RUN set -e \
    && if [ -d "dist" ]; then \
         echo "Using root dist directory"; \
       elif [ -d "apps/backend/dist" ]; then \
         echo "Syncing apps/backend/dist to root dist"; \
         mkdir -p dist; \
         cp -r apps/backend/dist/* dist/; \
       else \
         echo "Error: No dist directory produced by build"; \
         ls -la; \
         ls -la apps/backend || true; \
         exit 1; \
       fi

# ---------- Runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

WORKDIR /app

# Copy full build output and runtime deps
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

# Drop privileges: use non-root node user
USER node

ENV PORT=8080
EXPOSE 8080

# Default command: start the compiled server (matches package.json start script)
CMD ["node", "dist/apps/backend/src/index.js"]
