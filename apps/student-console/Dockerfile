# Build from repo root: docker build -f apps/student-console/Dockerfile .
# NEXT_PUBLIC_* via build-args (root .env); server secrets via env_file at runtime.
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
RUN npm install -g turbo@2

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune student-console --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .

ARG NEXT_PUBLIC_APP_ENV=development
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ARG NEXT_PUBLIC_URL=http://localhost:3008

ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL

RUN pnpm turbo run build --filter=student-console...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=installer --chown=nextjs:nodejs /app/apps/student-console/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/student-console/.next/static ./apps/student-console/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/student-console/public ./apps/student-console/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/student-console/server.js"]
