FROM node:22-alpine

WORKDIR /app

COPY apps/backend/package*.json ./apps/backend/
# RUN npm ci --only=production
RUN npm install

RUN npm run build

COPY apps/backend ./

CMD ["npm", "run", "start"] 
