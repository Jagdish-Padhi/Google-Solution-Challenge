FROM node:20-alpine

# Install build dependencies for bcrypt/native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY . .

# Set production environment
ENV NODE_ENV=production

# Production start command
CMD ["npm", "start"]
