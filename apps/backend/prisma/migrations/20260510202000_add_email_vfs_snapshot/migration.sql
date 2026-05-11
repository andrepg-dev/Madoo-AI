-- CreateTable
CREATE TABLE "EmailVfsSnapshot" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL DEFAULT 'Email.tsx',
    "componentCode" TEXT NOT NULL,
    "componentHash" TEXT NOT NULL,
    "sourceVariantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailVfsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailVfsSnapshot_emailId_key" ON "EmailVfsSnapshot"("emailId");

-- CreateIndex
CREATE INDEX "EmailVfsSnapshot_workspaceId_updatedAt_idx" ON "EmailVfsSnapshot"("workspaceId", "updatedAt");

-- AddForeignKey
ALTER TABLE "EmailVfsSnapshot" ADD CONSTRAINT "EmailVfsSnapshot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVfsSnapshot" ADD CONSTRAINT "EmailVfsSnapshot_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

