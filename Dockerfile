# =============================================================================
# Multi-stage Dockerfile for Next.js Science Portal
# =============================================================================

# Stage 1: Dependencies
# Install dependencies only when needed
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Stage 2: Builder
# Rebuild the source code only when needed
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Accept build arguments for required environment variables
ARG NEXT_PUBLIC_LOGIN_API=https://ws-cadc.canfar.net/ac
ARG NEXT_PUBLIC_SKAHA_API=https://ws-uv.canfar.net/skaha
ARG NEXT_PUBLIC_SRC_SKAHA_API=https://src.canfar.net/skaha
ARG NEXT_PUBLIC_SRC_CAVERN_API=https://src.canfar.net/cavern
ARG NEXT_PUBLIC_API_TIMEOUT=30000
ARG NEXT_PUBLIC_USE_CANFAR=true
ARG NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=false
ARG NEXT_PUBLIC_EXPERIMENTAL=true

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_LOGIN_API=$NEXT_PUBLIC_LOGIN_API
ENV NEXT_PUBLIC_SKAHA_API=$NEXT_PUBLIC_SKAHA_API
ENV NEXT_PUBLIC_SRC_SKAHA_API=$NEXT_PUBLIC_SRC_SKAHA_API
ENV NEXT_PUBLIC_SRC_CAVERN_API=$NEXT_PUBLIC_SRC_CAVERN_API
ENV NEXT_PUBLIC_API_TIMEOUT=$NEXT_PUBLIC_API_TIMEOUT
ENV NEXT_PUBLIC_USE_CANFAR=$NEXT_PUBLIC_USE_CANFAR
ENV NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=$NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS
ENV NEXT_PUBLIC_EXPERIMENTAL=$NEXT_PUBLIC_EXPERIMENTAL

# Build Next.js application
# The standalone output will be in .next/standalone
RUN npm run build

# Stage 3: Runner
# Production image, copy all the files and run next
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly (graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

# Start the Next.js server
CMD ["node", "server.js"]
