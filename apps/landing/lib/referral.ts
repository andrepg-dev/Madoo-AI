import { REFERRAL_QUERY_PARAM } from "@madoo/shared";

const STORAGE_KEY = "madoo_ref";
const MAX_CODE_LENGTH = 64;

function sanitize(code: string | null | undefined): string | undefined {
  const trimmed = code?.trim();
  if (!trimmed) return undefined;
  // Codes are short and url-safe; ignore anything implausible.
  if (trimmed.length > MAX_CODE_LENGTH) return undefined;
  return trimmed;
}

/**
 * Reads `?ref=CODE` from the current URL and persists it so the code survives
 * navigation up to the point the visitor signs up. Safe to call repeatedly; an
 * already-stored code is not overwritten by a visit without `?ref`.
 */
export function captureReferralFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const code = sanitize(params.get(REFERRAL_QUERY_PARAM));
    if (code) window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Private-mode / storage-disabled: referral attribution is best-effort.
  }
}

/** The stored referral code, if any. */
export function getStoredReferralCode(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return sanitize(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return undefined;
  }
}
