# FROM node:22-alpine

# # Install build tools for native deps (if needed)
# RUN apk add --no-cache python3 make g++

# WORKDIR /app

# # Copy package.json first for better caching
# COPY apps/backend/package*.json ./apps/backend/

# # Install deps
# WORKDIR /app/apps/backend
# RUN npm install

# # Copy backend source AFTER installing deps
# COPY apps/backend ./

# # Now build
# RUN npm run build

# # Run app
# CMD ["npm", "run", "start"]




# =========================
# BUILD STAGE
# =========================
FROM node:22-alpine AS builder

# Native build tools for common native deps (bcrypt/sharp/node-gyp, etc.)
RUN apk add --no-cache python3 make g++

WORKDIR /repo

# 1) Copy only files needed to install dependencies (great for cache)
COPY package*.json ./

# Copy the backend package.json so workspaces resolve quickly
COPY apps/backend/package*.json ./apps/backend/

# 2) Install ALL deps for the whole monorepo (includes dev deps)
RUN npm ci

# 3) Copy the rest of the source
COPY . .

# 4) Build backend via workspace script
RUN npm run --workspace=apps/backend build

# 5) Prune dev deps AFTER build to keep runtime light
RUN npm prune --omit=dev

# =========================
# RUNTIME STAGE
# =========================
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy only the compiled backend and production node_modules
COPY --from=builder /repo/apps/backend/dist ./dist
COPY --from=builder /repo/package*.json ./
COPY --from=builder /repo/apps/backend/package*.json ./apps/backend/
# Copy only the production node_modules from builder (they’re pruned)
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/backend/node_modules ./apps/backend/node_modules

# Drop privileges
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 8080
CMD ["node", "dist/index.js"]
