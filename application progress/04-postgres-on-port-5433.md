# 04 — Move madoo Postgres to port 5433

## Problem
After creating `.env` files, Prisma still failed with `P1010: User 'madoo' was denied access on the database 'madoo.public'`. The container actually listening on `localhost:5432` was an unrelated project (`postgres_db`, image `postgres:16.2`, user `blaze`, db `blaze_database`), so Prisma was authenticating against the wrong server.

## Decision
Non-destructive: leave the blaze container running and move madoo Postgres to port **5433** instead of stopping the other project's database.

## Changes
- `.env`: `POSTGRES_PORT=5433` (consumed by `docker-compose.yml`)
- `apps/backend/.env`: `DATABASE_URL=postgresql://madoo:madoo@localhost:5433/madoo?schema=public`
- `docker compose up -d` recreated `madoo-postgres` bound to host port 5433
- `pnpm prisma db push` synced the schema to the fresh DB

## Verify
- `docker port madoo-postgres` → `5432/tcp -> 0.0.0.0:5433`
- `docker exec madoo-postgres pg_isready -U madoo -d madoo` → accepting connections
