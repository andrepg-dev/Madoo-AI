# Build stage
FROM node:22-alpine AS builder

# Instalar OpenSSL para Prisma
RUN apk add --no-cache openssl

RUN npm install -g pnpm
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend ./apps/backend
COPY packages ./packages

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/backend
RUN pnpm prisma:generate
RUN pnpm build

# Runtime stage
FROM node:22-alpine

# Instalar OpenSSL en el entorno de ejecución para el Query Engine de Prisma
RUN apk add --no-cache openssl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

RUN mkdir -p /app && chown -R nestjs:nodejs /app
WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package.json ./apps/backend/
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nestjs:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/prisma ./apps/backend/prisma

WORKDIR /app/apps/backend

# Switch to non-root user
USER nestjs

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000), (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]