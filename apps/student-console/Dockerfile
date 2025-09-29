# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-alpine AS builder
ENV CI=true
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_BASE_URL
ARG NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_BASE_URL=$NEXT_PUBLIC_APP_BASE_URL
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY turbo.json ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY apps/student-console/package.json apps/student-console/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/utils/package.json packages/utils/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json

RUN pnpm install --frozen-lockfile

COPY . .

# Build only student-console
RUN pnpm --filter student-console... build

# ---------- Runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
WORKDIR /app

# Copy app code and node_modules for runtime
COPY --from=builder /app/apps/student-console/package.json /app/apps/student-console/package.json
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/student-console/.next /app/apps/student-console/.next
COPY --from=builder /app/apps/student-console/public /app/apps/student-console/public

ENV PORT=3008
EXPOSE 3008

CMD ["pnpm", "--filter", "student-console", "start"]
