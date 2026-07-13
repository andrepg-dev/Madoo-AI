-- Drop unused tone/length/audience columns from Email and PendingPrompt.
ALTER TABLE "Email" DROP COLUMN IF EXISTS "tone";
ALTER TABLE "Email" DROP COLUMN IF EXISTS "length";
ALTER TABLE "Email" DROP COLUMN IF EXISTS "audience";

ALTER TABLE "PendingPrompt" DROP COLUMN IF EXISTS "tone";
ALTER TABLE "PendingPrompt" DROP COLUMN IF EXISTS "length";
ALTER TABLE "PendingPrompt" DROP COLUMN IF EXISTS "audience";
