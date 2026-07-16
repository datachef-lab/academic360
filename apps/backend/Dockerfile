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
ENV PUPPETEER_SKIP_DOWNLOAD=1

# Copy pruned lockfile + package.jsons
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/patches ./patches

RUN pnpm install --frozen-lockfile

# Copy pruned source
COPY --from=pruner /app/out/full/ .

RUN pnpm turbo run build --filter=backend...

# tsc-alias rewrites the tsconfig "paths" entries for redis/socket.io into
# relative node_modules directory imports, which ESM refuses to load.
# Normalize them back to bare specifiers.
RUN find apps/backend/dist -name "*.js" -exec sed -i -E \
    's#(from |import\()"(\.\./)+node_modules/(redis|socket\.io|@socket\.io/redis-adapter)"#\1"\3"#g' {} +

# ── Runner stage ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Chromium for Puppeteer (image bundles browser per architecture doc)
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 backend

# pnpm uses symlinked per-package node_modules; copy the whole workspace
# tree so module resolution works at runtime.
WORKDIR /app
COPY --from=installer --chown=backend:nodejs /app .

USER backend
WORKDIR /app/apps/backend
EXPOSE 8080
CMD ["node", "--stack-size=8192", "dist/apps/backend/src/index.js"]
