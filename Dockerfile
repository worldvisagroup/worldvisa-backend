# Production Dockerfile for Dokploy / container deployments
# Heroku uses buildpacks by default; this file is for Docker-based deploys (e.g. Dokploy)

FROM node:20-alpine

WORKDIR /app

# Build deps for sharp (node-gyp) when prebuild download fails (e.g. ECONNRESET in CI)
RUN apk add --no-cache python3 build-base

# Install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

RUN apk del python3 build-base

# Copy app and build templates (required for PDF generation)
COPY . .
RUN npm run build:templates

# Default port; override via PORT env in Dokploy
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run as non-root (Alpine node image provides 'node' user)
RUN chown -R node:node /app
USER node

# Use npm start → build:templates + pm2-runtime (already built above; start script runs both)
CMD ["npm", "start"]
