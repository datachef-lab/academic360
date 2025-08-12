FROM node:20-alpine 

WORKDIR /app

COPY apps/backend/package*.json ./
# RUN npm ci --only=production
RUN npm install

RUN npm run build

COPY apps/backend ./

CMD ["npm", "run", "start"] 
