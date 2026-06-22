-- AI credits become account-wide: one BillingSubscription per user, shared
-- across every workspace the user owns — instead of one subscription (and one
-- renewing credit pool) per workspace.
-- Hand-written: review before applying to production. Dev apply only.

-- 1. Add the new owning column (nullable while we backfill).
ALTER TABLE "BillingSubscription" ADD COLUMN "userId" TEXT;

-- 2. Attribute each existing subscription to its workspace's oldest OWNER.
UPDATE "BillingSubscription" b
SET "userId" = m."userId"
FROM (
  SELECT DISTINCT ON ("workspaceId") "workspaceId", "userId"
  FROM "Membership"
  WHERE "role" = 'OWNER'
  ORDER BY "workspaceId", "createdAt" ASC
) m
WHERE m."workspaceId" = b."workspaceId";

-- 3. Collapse duplicates: a user may have owned several workspaces, each with
--    its own subscription. Keep the strongest one per user — highest plan, then
--    most bonus credits, then newest, with id as a final tiebreaker — and drop
--    the rest so the unique(userId) constraint can be added.
DELETE FROM "BillingSubscription" b
USING "BillingSubscription" keep
WHERE b."userId" = keep."userId"
  AND b."id" <> keep."id"
  AND (
    CASE keep."plan" WHEN 'PRO' THEN 3 WHEN 'MEDIUM' THEN 2 WHEN 'BASIC' THEN 1 ELSE 0 END,
    keep."bonusCredits",
    keep."createdAt",
    keep."id"
  ) > (
    CASE b."plan" WHEN 'PRO' THEN 3 WHEN 'MEDIUM' THEN 2 WHEN 'BASIC' THEN 1 ELSE 0 END,
    b."bonusCredits",
    b."createdAt",
    b."id"
  );

-- 4. Drop any rows we couldn't attribute (orphan workspaces with no owner).
DELETE FROM "BillingSubscription" WHERE "userId" IS NULL;

-- 5. Swap the keying column from workspace to user.
DROP INDEX IF EXISTS "BillingSubscription_workspaceId_key";
ALTER TABLE "BillingSubscription" DROP CONSTRAINT IF EXISTS "BillingSubscription_workspaceId_fkey";
ALTER TABLE "BillingSubscription" DROP COLUMN "workspaceId";

ALTER TABLE "BillingSubscription" ALTER COLUMN "userId" SET NOT NULL;
CREATE UNIQUE INDEX "BillingSubscription_userId_key" ON "BillingSubscription"("userId");
ALTER TABLE "BillingSubscription"
  ADD CONSTRAINT "BillingSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
