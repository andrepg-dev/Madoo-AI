-- Adds the PRO billing plan as a real, separately-priced Stripe plan.
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'PRO';
