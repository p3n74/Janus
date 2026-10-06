# Use specific Bun version for reproducibility (matches package.json)
FROM oven/bun:1.3.2 AS base
WORKDIR /app

USER root
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

# Build stage
FROM base AS builder

# Build arguments for environment variables
# VITE_SERVER_URL should be set to your Cloud Run URL (without trailing slash)
# If not set, will default to using current origin at runtime
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=${VITE_SERVER_URL:-}

# Copy all files first to ensure workspace resolution works for catalogs and prisma configs
# This is necessary for Bun workspaces to properly resolve dependencies
COPY . .

# Install dependencies
RUN bun install --frozen-lockfile

# Generate Prisma Client
RUN bun run db:generate

# Build the applications
RUN bun run build

# Production stage
FROM base AS runner

# Set production environment
ENV NODE_ENV=production

# Coolify / reverse proxies set PORT; default to 3000 for this host
ENV PORT=3000

WORKDIR /app

# Copy built application and dependencies from builder
COPY --from=builder /app /app
RUN chmod +x /app/docker/start.sh

EXPOSE 3000

# Coolify HTTP probes need curl in the image
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${PORT:-3000}/health || exit 1

# Push Prisma schema, seed the admin whitelist row, then start the API
CMD ["sh", "/app/docker/start.sh"]
