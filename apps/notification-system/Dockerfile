# Build from repo root: docker build -f apps/notification-system/Dockerfile .
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
RUN npm install -g turbo@2

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune notification-system --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=notification-system...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 notifier

COPY --from=installer --chown=notifier:nodejs /app/apps/notification-system/dist ./dist
COPY --from=installer --chown=notifier:nodejs /app/apps/notification-system/package.json ./package.json
COPY --from=installer --chown=notifier:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=notifier:nodejs /app/packages ./packages

USER notifier
EXPOSE 8091
CMD ["node", "--stack-size=8192", "dist/apps/notification-system/src/index.js"]
