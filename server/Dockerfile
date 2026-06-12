FROM node:20-alpine

# Install build dependencies, ffmpeg, system chromium and fonts
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use the system-installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

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

