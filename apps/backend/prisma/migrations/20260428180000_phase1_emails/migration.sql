-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('DRAFT', 'GENERATING', 'READY', 'ERROR');

-- CreateEnum
CREATE TYPE "GenerationRunKind" AS ENUM ('INITIAL', 'EDIT');

-- CreateEnum
CREATE TYPE "GenerationRunStatus" AS ENUM ('STARTED', 'STREAMING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'DRAFT',
    "prompt" TEXT NOT NULL,
    "tone" TEXT,
    "length" TEXT,
    "audience" TEXT,
    "title" TEXT,
    "templateId" TEXT,
    "sourcePendingPromptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVariant" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "componentCode" TEXT NOT NULL,
    "compiledHtml" TEXT NOT NULL,
    "variableSchema" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailGenerationRun" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "kind" "GenerationRunKind" NOT NULL,
    "status" "GenerationRunStatus" NOT NULL DEFAULT 'STARTED',
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "cacheCreationInputTokens" INTEGER,
    "cacheReadInputTokens" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "EmailGenerationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "componentCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Email_sourcePendingPromptId_key" ON "Email"("sourcePendingPromptId");

-- CreateIndex
CREATE INDEX "Email_workspaceId_createdAt_idx" ON "Email"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailVariant_workspaceId_emailId_idx" ON "EmailVariant"("workspaceId", "emailId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVariant_emailId_seq_key" ON "EmailVariant"("emailId", "seq");

-- CreateIndex
CREATE INDEX "EmailGenerationRun_emailId_createdAt_idx" ON "EmailGenerationRun"("emailId", "createdAt");

-- CreateIndex
CREATE INDEX "Template_workspaceId_idx" ON "Template"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Template_workspaceId_slug_key" ON "Template"("workspaceId", "slug");

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_sourcePendingPromptId_fkey" FOREIGN KEY ("sourcePendingPromptId") REFERENCES "PendingPrompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVariant" ADD CONSTRAINT "EmailVariant_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVariant" ADD CONSTRAINT "EmailVariant_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailGenerationRun" ADD CONSTRAINT "EmailGenerationRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailGenerationRun" ADD CONSTRAINT "EmailGenerationRun_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
