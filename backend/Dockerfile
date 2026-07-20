# Multi-stage build for NestJS with pnpm
# Base image with Node.js 24 Alpine (lightweight)
FROM node:24-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@10

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
FROM node:24-alpine AS production

# Install extra tools (nano for file editing/debugging)
RUN apk add --no-cache nano

# Install pnpm globally
RUN npm install -g pnpm@10

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
