FROM node:20-alpine

# Install sharp dependencies (if needed on alpine)
RUN apk add --no-cache vips-dev build-base

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose API port
EXPOSE 5000

# Run with PM2 in production
RUN npm install -g pm2
CMD ["pm2-runtime", "ecosystem.config.cjs"]
