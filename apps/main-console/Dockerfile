# Build from repo root: docker build -f apps/main-console/Dockerfile .
# VITE_* must be set via build-args (root .env + docker compose build).
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
RUN npm install -g turbo@2

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune main-console --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .

ARG VITE_APP_BACKEND_URL=http://localhost:8080
ARG VITE_APP_STUDENT_CONSOLE_URL=http://localhost:3008
ARG VITE_STUDENT_PROFILE_URL=
ARG VITE_STUDENT_IMAGE_BASE_URL=https://besc.academic360.app/id-card-generate/api/images?crop=true&uid=
ARG VITE_APP_PREFIX=

ENV VITE_APP_BACKEND_URL=$VITE_APP_BACKEND_URL
ENV VITE_APP_STUDENT_CONSOLE_URL=$VITE_APP_STUDENT_CONSOLE_URL
ENV VITE_STUDENT_PROFILE_URL=$VITE_STUDENT_PROFILE_URL
ENV VITE_STUDENT_IMAGE_BASE_URL=$VITE_STUDENT_IMAGE_BASE_URL
ENV VITE_APP_PREFIX=$VITE_APP_PREFIX

RUN pnpm turbo run build --filter=main-console...

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g serve@14
COPY --from=installer /app/apps/main-console/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
