/**
 * Pure date/credit helpers for the AI-credit windows. Kept free of NestJS,
 * Prisma, and Stripe imports so they can be unit-tested in isolation.
 *
 * Credit model:
 *  - Daily window resets at 00:00 UTC.
 *  - Monthly window rolls forward one calendar month at a time from the
 *    subscription's `creditsAnchor` (which is reset on every plan change).
 */

export function startOfUtcDay(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function addUtcDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

export function addUtcMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() + n);
  return r;
}

/**
 * Start of the current rolling monthly window: the latest `anchor + k months`
 * that is still <= now. Rolls forward one calendar month at a time so the
 * window tracks the anchor day rather than the calendar month. If the anchor is
 * in the future (clock skew / freshly created), the anchor itself is returned.
 */
export function currentPeriodStart(anchor: Date, now: Date): Date {
  let start = new Date(anchor);
  if (start.getTime() > now.getTime()) return start;
  let guard = 0;
  while (guard++ < 1000) {
    const next = addUtcMonths(start, 1);
    if (next.getTime() > now.getTime()) break;
    start = next;
  }
  return start;
}

export type CreditUsage = {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
};

export function buildCreditUsage(
  used: number,
  limit: number,
  resetsAt: Date,
): CreditUsage {
  return {
    used,
    limit,
    remaining: limit === -1 ? -1 : Math.max(0, limit - used),
    resetsAt: resetsAt.toISOString(),
  };
}
