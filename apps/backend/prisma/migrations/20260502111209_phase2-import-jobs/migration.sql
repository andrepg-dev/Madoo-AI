-- CreateEnum
CREATE TYPE "ContactImportJobStatus" AS ENUM ('UPLOADED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ContactImportJob" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "status" "ContactImportJobStatus" NOT NULL DEFAULT 'UPLOADED',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactImportJob_workspaceId_status_idx" ON "ContactImportJob"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "ContactImportJob_workspaceId_createdAt_idx" ON "ContactImportJob"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "ContactImportJob" ADD CONSTRAINT "ContactImportJob_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

