FROM node:20-alpine

# Install Chromium and dependencies for Puppeteer.
# openssl + libc6-compat: Prisma engines need libssl; without them Alpine often defaults to openssl-1.1.x
# and migrate fails at runtime with "Could not parse schema engine response".
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  openssl \
  libc6-compat

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install pnpm
RUN corepack enable pnpm

WORKDIR /app

# Copy lockfile and configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy source code
COPY apps/backend ./apps/backend
COPY packages ./packages
# If there are other workspace packages needed, they are in packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN pnpm prisma:generate

# Build the project
WORKDIR /app
RUN pnpm --filter @madoo/backend build

WORKDIR /app/apps/backend

# Apply migrations (recover P3009 failed migration if needed), then start the API.
CMD ["sh", "/app/apps/backend/docker-entrypoint.sh"]
