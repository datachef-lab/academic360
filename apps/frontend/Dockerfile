FROM node:20-alpine 

WORKDIR /app
COPY apps/frontend/package*.json ./
# RUN npm ci --only=production
RUN npm install
COPY apps/frontend ./
RUN npm run build

# Install a static file server
RUN npm install -g serve

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
