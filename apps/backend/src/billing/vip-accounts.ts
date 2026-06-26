/**
 * Comped "growth" accounts: emails that automatically receive a PRO subscription
 * when they sign in / sign up. Used for streamers, creators, and partners who
 * help the product grow. Add lowercase emails here; matching is case-insensitive.
 *
 * This is intentionally a code-level allowlist (deployed with the app) so the
 * list is reviewable in git. The grant itself is applied to the production
 * database on each login (see AuthService.applyVipPlan).
 */
export const VIP_PRO_EMAILS: readonly string[] = ["hi@midu.dev"];

/** Case-insensitive membership check against the VIP comp list. */
export function isVipProEmail(email: string): boolean {
  return VIP_PRO_EMAILS.includes(email.trim().toLowerCase());
}
