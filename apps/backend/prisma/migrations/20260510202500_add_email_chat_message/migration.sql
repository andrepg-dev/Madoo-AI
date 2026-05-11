-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmailChatRole') THEN
        CREATE TYPE "EmailChatRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmailChatKind') THEN
        CREATE TYPE "EmailChatKind" AS ENUM ('TEXT', 'THINKING', 'STATUS');
    END IF;
END $$;

-- CreateTable
CREATE TABLE "EmailChatMessage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "role" "EmailChatRole" NOT NULL,
    "kind" "EmailChatKind" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailChatMessage_emailId_createdAt_idx" ON "EmailChatMessage"("emailId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailChatMessage_workspaceId_emailId_role_idx" ON "EmailChatMessage"("workspaceId", "emailId", "role");

-- AddForeignKey
ALTER TABLE "EmailChatMessage" ADD CONSTRAINT "EmailChatMessage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailChatMessage" ADD CONSTRAINT "EmailChatMessage_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

