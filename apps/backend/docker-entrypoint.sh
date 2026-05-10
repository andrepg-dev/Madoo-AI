#!/bin/sh
set -e
cd /app/apps/backend

# P3009: a previous run can leave a migration marked "failed" in _prisma_migrations. Clear it so
# migrate deploy can run. No-op if this migration is not in a failed state.
pnpm exec prisma migrate resolve --rolled-back "20260507120000_email_template_saved_at" \
  2>/dev/null || true

pnpm prisma:deploy
exec pnpm start:prod
