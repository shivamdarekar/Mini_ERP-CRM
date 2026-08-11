# Stage 1: builder
# install dependencies, generate Prisma client,
# and compile TypeScript.

FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first for Docker layer caching
COPY package*.json ./

# Install all dependencies because TypeScript build
# requires development dependencies.
RUN npm ci

# Copy Prisma schema and generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy TypeScript configuration, prisma config, and source
COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY src ./src

# Compile TypeScript
RUN npm run build


# ============================================================
# Stage 2: Production
# Lean production image.
# ============================================================
FROM node:22-alpine AS production

WORKDIR /app

# curl is required by Docker HEALTHCHECK
RUN apk add --no-cache curl

# Create non-root application user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S appuser -u 1001 -G nodejs

ENV NODE_ENV=production

# Install production dependencies only
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma schema, migrations, and generated client
# .prisma must be copied AFTER npm ci — otherwise npm ci overwrites it
COPY --from=builder --chown=appuser:nodejs /app/prisma ./prisma
COPY --from=builder --chown=appuser:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=appuser:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled JavaScript
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist

# Run application as non-root user
USER appuser

# ERP health endpoint
# Change this path only if your backend uses a different endpoint.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

EXPOSE 5000

CMD ["node", "dist/server.js"]