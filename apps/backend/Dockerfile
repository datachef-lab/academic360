FROM node:20-alpine AS base
RUN npm install -g pnpm turbo

# ── Prune stage ───────────────────────────────────────────────────────
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune --scope=backend --docker

# ── Installer stage ───────────────────────────────────────────────────
FROM base AS installer
WORKDIR /app

# Copy pruned lockfile + package.jsons
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN pnpm install --frozen-lockfile

# Copy pruned source
COPY --from=pruner /app/out/full/ .

RUN pnpm turbo run build --filter=backend...

# ── Runner stage ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend
USER backend

COPY --from=installer --chown=backend:nodejs /app/apps/backend/dist ./dist
COPY --from=installer --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=backend:nodejs /app/apps/backend/package.json .

EXPOSE 5000
CMD ["node", "dist/index.js"]