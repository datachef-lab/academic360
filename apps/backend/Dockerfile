# Build from repo root: docker build -f apps/backend/Dockerfile .
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
RUN npm install -g turbo@2

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune backend --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=backend...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 backend

COPY --from=installer --chown=backend:nodejs /app/apps/backend/dist ./dist
COPY --from=installer --chown=backend:nodejs /app/apps/backend/package.json ./package.json
COPY --from=installer --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=backend:nodejs /app/packages ./packages

USER backend
EXPOSE 8080
CMD ["node", "--stack-size=8192", "dist/apps/backend/src/index.js"]
