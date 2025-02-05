# Use Node.js for build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json separately for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Build the React app
RUN npm run build

# Use Nginx as base image
FROM nginx:latest

# Copy build files to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf  

# Expose frontend port
EXPOSE 3003

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
