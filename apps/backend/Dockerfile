# Use Node.js as base image
FROM node:18

# Set the timezone to Asia/Kolkata
ENV TZ=Asia/Kolkata
RUN apt-get install -y tzdata

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY ../../package*.json ./

# Install dependencies (faster, consistent)
RUN npm install

# Copy the rest of the code
COPY . .

# Set correct permissions (optional but recommended)
RUN chmod -R 755 /app

# Build the TypeScript code
RUN npm run build

RUN npm run db:generate && npm run db:migrate

# Start the application
CMD ["npm", "run", "start"]
