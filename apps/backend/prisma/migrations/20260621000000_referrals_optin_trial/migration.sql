-- Share-Madoo referral credits + opt-in 7-day trial.
-- Hand-written: review before applying to production. Dev apply only.

-- User: own share code + who referred them (self-relation, set once at signup).
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN "referredByUserId" TEXT;

CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "User_referredByUserId_idx" ON "User"("referredByUserId");

ALTER TABLE "User"
  ADD CONSTRAINT "User_referredByUserId_fkey"
  FOREIGN KEY ("referredByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- BillingSubscription: opt-in trial flag + consumable referral bonus balance.
ALTER TABLE "BillingSubscription"
  ADD COLUMN "trialClaimed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BillingSubscription"
  ADD COLUMN "bonusCredits" INTEGER NOT NULL DEFAULT 0;

-- ReferralReward: idempotent ledger (one reward per referred user).
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralReward_referredUserId_key" ON "ReferralReward"("referredUserId");
CREATE INDEX "ReferralReward_referrerUserId_idx" ON "ReferralReward"("referrerUserId");

ALTER TABLE "ReferralReward"
  ADD CONSTRAINT "ReferralReward_referrerUserId_fkey"
  FOREIGN KEY ("referrerUserId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
