CREATE TYPE "EmailChatFeedback" AS ENUM ('LIKE', 'DISLIKE');

ALTER TABLE "EmailChatMessage"
ADD COLUMN "feedback" "EmailChatFeedback";
