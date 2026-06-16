-- AlterTable
ALTER TABLE "EmailChatMessage" ADD COLUMN     "groupId" TEXT;

-- CreateIndex
CREATE INDEX "EmailChatMessage_emailId_groupId_idx" ON "EmailChatMessage"("emailId", "groupId");
