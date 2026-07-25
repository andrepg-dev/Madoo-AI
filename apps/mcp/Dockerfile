FROM node:22-alpine

RUN corepack enable pnpm
WORKDIR /app

# Workspace manifests first for layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/mcp ./apps/mcp
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @madoo/mcp build

WORKDIR /app/apps/mcp
EXPOSE 4100
CMD ["node", "dist/index.js"]
