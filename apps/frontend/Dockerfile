# # FROM node:22-alpine

# # WORKDIR /app
# # COPY apps/frontend/package*.json ./apps/frontend/
# # # RUN npm ci --only=production
# # RUN npm install
# # COPY apps/frontend ./
# # RUN npm run build

# # # Install a static file server
# # RUN npm install -g serve

# # CMD ["serve", "-s", "dist"]


# FROM node:22-alpine

# # Install build tools for native deps (if needed)
# RUN apk add --no-cache python3 make g++

# WORKDIR /app

# # Copy package.json first for better caching
# COPY apps/frontend/package*.json ./apps/frontend/

# # Install deps
# WORKDIR /app/apps/frontend
# RUN npm install

# # Copy backend source AFTER installing deps
# COPY apps/frontend ./

# # Now build
# RUN npm run build

# # # Install a static file server
# RUN npm install -g serve

# CMD ["serve", "-s", "dist"]




# =========================
# BUILD STAGE
# =========================
FROM node:22-alpine AS builder

WORKDIR /repo

# workspaces install
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
RUN npm ci

COPY . .
RUN npm run --workspace=apps/frontend build

# =========================
# RUNTIME STAGE
# =========================
FROM node:22-alpine AS runtime

WORKDIR /app

# simple static server
RUN npm install -g serve

# copy built assets
COPY --from=builder /repo/apps/frontend/dist ./dist

# non-root
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000
CMD ["serve", "-s", "dist"]
