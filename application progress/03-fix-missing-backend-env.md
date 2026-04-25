# 03 — Fix missing backend env (DATABASE_URL)

## Problem
Backend boot crashed with `PrismaClientInitializationError: Environment variable not found: DATABASE_URL` (P1012) at `apps/backend/src/prisma/prisma.service.ts:7`.

## Root cause
No `.env` files existed — only `.env.example` templates were tracked. Prisma reads `DATABASE_URL` from `apps/backend/.env`, which was absent.

## Fix
- Copied `apps/backend/.env.example` → `apps/backend/.env`
- Copied `.env.example` → `.env` (used by docker-compose for the Postgres container)

Postgres container (`postgres_db`) was already running on port 5432, so no further action needed. Restart the backend dev server to pick up the env.
