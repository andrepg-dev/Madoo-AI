-- Rename public billing plan enum values to match product names.
-- Existing stored rows are rewritten by PostgreSQL when enum values are renamed.
ALTER TYPE "Plan" RENAME VALUE 'STARTER' TO 'BASIC';
ALTER TYPE "Plan" RENAME VALUE 'GROWTH' TO 'MEDIUM';
