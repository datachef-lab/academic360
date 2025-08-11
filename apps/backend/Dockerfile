FROM node:20-alpine 

WORKDIR /app

COPY apps/backend/package*.json ./
# RUN npm ci --only=production
RUN npm install

COPY apps/backend ./

EXPOSE 8080
CMD ["node", "dist/index.js"] # Change this if using NestJS/Express compiled output
