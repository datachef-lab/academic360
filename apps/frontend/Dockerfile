FROM node:22-alpine

WORKDIR /app
COPY apps/frontend/package*.json ./
# RUN npm ci --only=production
RUN npm install
COPY apps/frontend ./
RUN npm run build

# Install a static file server
RUN npm install -g serve

CMD ["serve", "-s", "dist"]
