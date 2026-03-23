FROM node:20-alpine AS base
RUN npm install -g pnpm turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune main-console --docker

FROM base AS installer
WORKDIR /app
# Layer 1: deps metadata (cached unless package.json/lockfile changes)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Layer 2: source (cached unless source changes)
COPY --from=pruner /app/out/full/ .

# .env.local must exist before build (Vite bakes it in); use .env.example (or mount .env.local for prod)
COPY apps/main-console/.env.example ./apps/main-console/.env.example
RUN cp apps/main-console/.env.example apps/main-console/.env.local

# Layer 3: build (cached unless layers above change)
RUN pnpm turbo run build --filter=main-console

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g serve
COPY --from=installer /app/apps/main-console/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]