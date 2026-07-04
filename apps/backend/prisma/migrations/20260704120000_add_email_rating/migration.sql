-- CreateTable
CREATE TABLE "EmailRating" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailRating_emailId_userId_key" ON "EmailRating"("emailId", "userId");

-- CreateIndex
CREATE INDEX "EmailRating_emailId_idx" ON "EmailRating"("emailId");

-- CreateIndex
CREATE INDEX "EmailRating_rating_createdAt_idx" ON "EmailRating"("rating", "createdAt");

-- AddForeignKey
ALTER TABLE "EmailRating" ADD CONSTRAINT "EmailRating_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailRating" ADD CONSTRAINT "EmailRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
