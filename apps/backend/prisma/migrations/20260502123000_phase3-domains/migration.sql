-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'VERIFIED');

-- CreateEnum
CREATE TYPE "DnsCheckType" AS ENUM ('SPF', 'DKIM', 'DMARC', 'RETURN_PATH');

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "status" "DomainStatus" NOT NULL DEFAULT 'PENDING',
    "dkimPublicKey" TEXT NOT NULL,
    "dkimPrivateKey" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DnsCheck" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "type" "DnsCheckType" NOT NULL,
    "hostname" TEXT NOT NULL,
    "expected" TEXT NOT NULL,
    "actual" TEXT,
    "ok" BOOLEAN NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DnsCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Domain_workspaceId_status_idx" ON "Domain"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_workspaceId_hostname_key" ON "Domain"("workspaceId", "hostname");

-- CreateIndex
CREATE INDEX "DnsCheck_workspaceId_domainId_type_checkedAt_idx" ON "DnsCheck"("workspaceId", "domainId", "type", "checkedAt");

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DnsCheck" ADD CONSTRAINT "DnsCheck_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DnsCheck" ADD CONSTRAINT "DnsCheck_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
