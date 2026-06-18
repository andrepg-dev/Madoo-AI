-- Adds 7-day free-trial tracking to billing subscriptions.
-- trialEndsAt mirrors Stripe's subscription.trial_end for UI display.
-- hasUsedTrial is set once a workspace consumes its trial so re-subscribing
-- after cancellation does not grant a second free trial.
ALTER TABLE "BillingSubscription"
ADD COLUMN "trialEndsAt" TIMESTAMP(3),
ADD COLUMN "hasUsedTrial" BOOLEAN NOT NULL DEFAULT false;
