-- AlterTable
ALTER TABLE "Email" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "Email" ADD COLUMN "templateSavedByUserId" TEXT;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN "createdByUserId" TEXT;

-- CreateTable
CREATE TABLE "ProductEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "workspaceId" TEXT,
    "name" TEXT NOT NULL,
    "source" TEXT,
    "properties" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Email_createdByUserId_createdAt_idx" ON "Email"("createdByUserId", "createdAt");
CREATE INDEX "Email_templateSavedByUserId_templateSavedAt_idx" ON "Email"("templateSavedByUserId", "templateSavedAt");
CREATE INDEX "Template_createdByUserId_createdAt_idx" ON "Template"("createdByUserId", "createdAt");
CREATE INDEX "ProductEvent_name_occurredAt_idx" ON "ProductEvent"("name", "occurredAt");
CREATE INDEX "ProductEvent_userId_occurredAt_idx" ON "ProductEvent"("userId", "occurredAt");
CREATE INDEX "ProductEvent_workspaceId_occurredAt_idx" ON "ProductEvent"("workspaceId", "occurredAt");

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Email" ADD CONSTRAINT "Email_templateSavedByUserId_fkey" FOREIGN KEY ("templateSavedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Template" ADD CONSTRAINT "Template_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductEvent" ADD CONSTRAINT "ProductEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductEvent" ADD CONSTRAINT "ProductEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
