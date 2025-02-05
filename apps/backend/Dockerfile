# Use Node.js as base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (faster, consistent)
RUN npm ci --only=production

# Copy the rest of the code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose backend port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start"]
