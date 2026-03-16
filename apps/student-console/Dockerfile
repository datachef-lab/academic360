# apps/student-console/Dockerfile

FROM node:20-alpine AS base
RUN npm install -g pnpm turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune --scope=student-console --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=student-console

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer --chown=nextjs:nodejs /app/apps/student-console/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/student-console/.next/static ./apps/student-console/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/student-console/public ./apps/student-console/public

EXPOSE 3000
CMD ["node", "apps/student-console/server.js"]