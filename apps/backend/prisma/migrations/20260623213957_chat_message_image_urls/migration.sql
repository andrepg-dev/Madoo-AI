-- AlterTable
ALTER TABLE "EmailChatMessage" ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
