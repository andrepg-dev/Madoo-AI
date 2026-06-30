-- AlterTable
ALTER TABLE "PendingPrompt" ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
