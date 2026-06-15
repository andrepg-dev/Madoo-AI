-- AlterTable
ALTER TABLE "Template"
  ADD COLUMN "variableSchema" JSONB;

-- CreateTable
CREATE TABLE "CommunityTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "componentCode" TEXT NOT NULL,
    "compiledHtml" TEXT NOT NULL,
    "previewUrl" TEXT,
    "variableSchema" JSONB NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorName" TEXT,
    "sourceEmailId" TEXT,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityTemplateStar" (
    "id" TEXT NOT NULL,
    "communityTemplateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityTemplateStar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityTemplate_createdAt_idx" ON "CommunityTemplate"("createdAt");

-- CreateIndex
CREATE INDEX "CommunityTemplateStar_userId_idx" ON "CommunityTemplateStar"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityTemplateStar_communityTemplateId_userId_key" ON "CommunityTemplateStar"("communityTemplateId", "userId");

-- AddForeignKey
ALTER TABLE "CommunityTemplate" ADD CONSTRAINT "CommunityTemplate_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityTemplateStar" ADD CONSTRAINT "CommunityTemplateStar_communityTemplateId_fkey" FOREIGN KEY ("communityTemplateId") REFERENCES "CommunityTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityTemplateStar" ADD CONSTRAINT "CommunityTemplateStar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
