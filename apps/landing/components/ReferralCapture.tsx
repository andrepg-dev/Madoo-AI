"use client";

import { useEffect } from "react";
import { captureReferralFromUrl } from "@/lib/referral";

/**
 * Invisible mount hook: persists any `?ref=CODE` on the landing URL so it can be
 * attached to the signup payload later. Rendered once at the app root.
 */
export function ReferralCapture() {
  useEffect(() => {
    captureReferralFromUrl();
  }, []);
  return null;
}
