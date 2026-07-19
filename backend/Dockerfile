# ── Stage 1: Dependencies ──────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Copy only package manifests first (layer cache optimization)
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# ── Stage 2: Production Image ──────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Add a non-root user for security
RUN addgroup -S carboniq && adduser -S carboniq -G carboniq

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src ./src
COPY package.json ./

# Use non-root user
USER carboniq

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

CMD ["node", "src/server.js"]
