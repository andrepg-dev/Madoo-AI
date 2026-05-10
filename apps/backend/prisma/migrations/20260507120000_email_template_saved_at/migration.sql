-- Mark when a pre-built template email is "saved" by the user
-- IF NOT EXISTS: safe if a failed deploy retried after partial apply or after resolve --rolled-back
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "templateSavedAt" TIMESTAMP(3);
