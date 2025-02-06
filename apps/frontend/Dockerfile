# Use Node.js for build stage
FROM node:18-alpine AS builder

# Set the timezone to Asia/Kolkata
ENV TZ=Asia/Kolkata
RUN apk add --no-cache tzdata

WORKDIR /app

# Copy all the code
COPY ./ ./

RUN npm install

# Use Nginx as base image
FROM nginx:latest

# Copy build files to Nginx
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY ./apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf  

# Expose frontend port
EXPOSE 3003

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
