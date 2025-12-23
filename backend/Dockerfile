# Multi-stage build for NestJS with pnpm
# Base image with Node.js 24 (Debian-based for Puppeteer support)
FROM node:24-bookworm-slim AS base

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# ===================================
# Dependencies stage
# ===================================
FROM base AS dependencies

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# ===================================
# Build stage
# ===================================
FROM base AS build

# Copy dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set dummy DATABASE_URL for Prisma generate (not used for actual connection)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"

# Generate Prisma Client
RUN pnpm prisma:generate

# Build the application
RUN pnpm run build

# ===================================
# Production stage
# ===================================
FROM node:24-bookworm-slim AS production

# Install Chrome dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy Prisma schema and migrations (required for deploy)
COPY prisma ./prisma

# Copy source files (needed for templates)
COPY src ./src

# Install only production dependencies (ignore prepare/husky scripts)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Set dummy DATABASE_URL for Prisma generate
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"

# Generate Prisma Client for production
RUN pnpm prisma:generate

# Install Chrome for Puppeteer
RUN pnpm puppeteer:install

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Create directories
RUN mkdir -p uploads

# Expose the application port (default: 3000, configurable via PORT env var)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1', (r) => {process.exit(r.statusCode === 404 ? 0 : 1)})"

# Start the application
CMD ["pnpm", "run", "start:prod"]
