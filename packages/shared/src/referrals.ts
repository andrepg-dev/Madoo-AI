import { z } from "zod";

/**
 * One-time bonus credits granted to the referrer each time a distinct invited
 * user converts to a real paid subscription (BASIC/MEDIUM/PRO, status ACTIVE).
 * Inviting users who stay on the free plan or only start a trial grants nothing.
 */
export const REFERRAL_REWARD_CREDITS = 100;

/** Query-string key the landing page reads to attribute a signup. */
export const REFERRAL_QUERY_PARAM = "ref";

/** The current user's referral link and lifetime stats. */
export const MyReferralSchema = z.object({
  /** The user's own share code (lazily created on first read). */
  code: z.string().min(1),
  /** Full share URL pointing at the landing page with `?ref=CODE`. */
  url: z.string().url(),
  /** How many users signed up through this user's code. */
  invitedCount: z.number().int().nonnegative(),
  /** How many invited users converted to a paid plan (earned a reward). */
  qualifiedCount: z.number().int().nonnegative(),
  /** Total bonus credits earned across all qualified referrals. */
  creditsEarned: z.number().int().nonnegative(),
  /** Credits granted per qualified (paid) referral, for explicit UI copy. */
  rewardPerReferral: z.number().int().nonnegative(),
});
export type MyReferralDto = z.infer<typeof MyReferralSchema>;

/** Optional referral code carried alongside any signup-capable auth payload. */
export const ReferralCodeFields = {
  referralCode: z.string().trim().min(1).max(64).optional(),
};

/** Result of claiming the opt-in 7-day trial for a workspace. */
export const ClaimTrialResponseSchema = z.object({
  trialClaimed: z.boolean(),
});
export type ClaimTrialResponse = z.infer<typeof ClaimTrialResponseSchema>;
