FROM node:20-alpine AS base
RUN npm install -g pnpm turbo

# ── Prune stage ───────────────────────────────────────────────────────
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune --scope=notification-system --docker

# ── Installer stage ───────────────────────────────────────────────────
FROM base AS installer
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/patches ./patches

RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

RUN pnpm turbo run build --filter=notification-system...

# ── Runner stage ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 worker

WORKDIR /app
COPY --from=installer --chown=worker:nodejs /app .

USER worker
WORKDIR /app/apps/notification-system
EXPOSE 5010
CMD ["node", "--stack-size=8192", "dist/apps/notification-system/src/index.js"]
