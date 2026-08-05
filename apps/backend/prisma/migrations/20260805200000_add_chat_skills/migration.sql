-- Design skills the user attached in the composer for a turn, so the chat can
-- be restored with them after a reload (same pattern as "imageUrls").
ALTER TABLE "EmailChatMessage" ADD COLUMN "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
