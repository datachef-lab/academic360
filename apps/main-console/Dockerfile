FROM node:20-alpine AS base
RUN npm install -g pnpm turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune --scope=main-console --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .

# ← .env.local must exist before build (Vite bakes it in)
COPY apps/main-console/.env.local ./apps/main-console/.env.local

RUN pnpm turbo run build --filter=main-console

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g serve
COPY --from=installer /app/apps/main-console/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]