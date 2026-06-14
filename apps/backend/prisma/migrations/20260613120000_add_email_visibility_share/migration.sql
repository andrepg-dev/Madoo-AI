-- CreateEnum
CREATE TYPE "EmailVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- AlterTable
ALTER TABLE "Email"
  ADD COLUMN "visibility" "EmailVisibility" NOT NULL DEFAULT 'PRIVATE',
  ADD COLUMN "publicId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Email_publicId_key" ON "Email"("publicId");
