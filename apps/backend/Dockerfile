FROM node:20-alpine 

WORKDIR /app

COPY apps/backend/package*.json ./
# RUN npm ci --only=production
RUN npm install

COPY apps/backend ./

CMD ["node", "dist/index.js"] 
