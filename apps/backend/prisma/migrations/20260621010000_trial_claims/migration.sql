-- Pre-signup opt-in 7-day trial claims (email reserved from the landing FAQ).
CREATE TABLE "TrialClaim" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialClaim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrialClaim_email_key" ON "TrialClaim"("email");
