FROM node:22-alpine

# Install build tools for native deps (if needed)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package.json first for better caching
COPY apps/backend/package*.json ./apps/backend/

# Install deps
WORKDIR /app/apps/backend
RUN npm install

# Copy backend source AFTER installing deps
COPY apps/backend ./

# Now build
RUN npm run build

# Run app
CMD ["npm", "run", "start"]
