# syntax=docker/dockerfile:1.6

# 1) Dependencies stage: install prod deps (sharp downloads prebuilt libvips)
FROM node:20-bookworm-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# 2) Builder stage: install dev deps and build TS
FROM node:20-bookworm-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# 3) Runtime stage: include system libvips with HEIF support
FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
# Install libvips and HEIF/AVIF codec dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips libvips-tools libheif1 libde265-0 libaom3 libx265-199 \
    curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
# copy production node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
# copy built code
COPY --from=builder /app/dist ./dist
COPY package.json ./package.json

# Ensure a non-root user
RUN useradd -r -u 1001 -g root appuser \
  && chown -R appuser:root /app
USER appuser

ENV PORT=8080
ENV HEALTHCHECK_PATH=/healthz
EXPOSE 8080

# Verify vips and HEIF support at build time (best effort)
RUN vips --version && vips -l | grep -i heif || true

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsSL http://localhost:${PORT}${HEALTHCHECK_PATH} || exit 1

CMD ["node", "dist/index.js"]
