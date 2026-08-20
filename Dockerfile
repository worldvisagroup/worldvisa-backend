# Production Dockerfile for Dokploy / container deployments
# Heroku uses buildpacks by default; this file is for Docker-based deploys (e.g. Dokploy)

FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293

WORKDIR /app

# pnpm is this project's actual package manager (pnpm-lock.yaml has real
# dependency-change history; package-lock.json never did) — pin it via
# corepack from package.json's packageManager field for a reproducible build.
RUN corepack enable

# Build deps for sharp (node-gyp) when prebuild download fails (e.g. ECONNRESET in CI)
RUN apk add --no-cache python3 build-base

# Install full deps (including dev) — tsc needs @types/node, @types/react
# to build the PDF templates below
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

RUN apk del python3 build-base

# Copy app and build templates (required for PDF generation)
COPY . .
RUN pnpm run build:templates

# Drop dev dependencies now that the build is done
RUN pnpm prune --prod

# Default port; override via PORT env in Dokploy
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run as non-root (Alpine node image provides 'node' user)
RUN chown -R node:node /app
USER node

CMD ["pnpm", "start"]
