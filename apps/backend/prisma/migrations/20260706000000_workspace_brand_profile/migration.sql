-- CreateTable
CREATE TABLE "WorkspaceBrandProfile" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "brandName" TEXT,
    "logoUrl" TEXT,
    "colors" JSONB,
    "fonts" JSONB,
    "copyTone" TEXT,
    "imageUrls" JSONB,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceBrandProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceBrandProfile_workspaceId_key" ON "WorkspaceBrandProfile"("workspaceId");

-- AddForeignKey
ALTER TABLE "WorkspaceBrandProfile" ADD CONSTRAINT "WorkspaceBrandProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
