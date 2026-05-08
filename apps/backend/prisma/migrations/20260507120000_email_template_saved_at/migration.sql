-- Mark when a pre-built template email is "saved" by the user
ALTER TABLE "Email" ADD COLUMN "templateSavedAt" TIMESTAMP(3);
