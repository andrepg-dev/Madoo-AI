-- Rolling monthly AI-credit window anchor. Existing rows start their window now;
-- the window then rolls forward one month at a time and is reset on plan changes.
ALTER TABLE "BillingSubscription"
ADD COLUMN "creditsAnchor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
