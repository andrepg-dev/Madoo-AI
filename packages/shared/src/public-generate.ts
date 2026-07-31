import { z } from "zod";

/**
 * Anonymous email generation used by the MCP acquisition tool. No user auth —
 * the MCP server presents a service token. Rate-limited per IP + global cap,
 * and soft-gated after a couple of free generations per MCP conversation
 * (see `continuationToken`).
 */
export const PublicGenerateSchema = z.object({
  brief: z.string().trim().min(5).max(2000),
  brandName: z.string().trim().max(120).optional(),
  brandUrl: z.string().url().max(500).optional(),
  /**
   * Opaque token handed back by the previous generation in this conversation.
   * Carries the free-generation counter so the caller can be pointed at a real
   * Madoo account once the free allowance is spent.
   */
  continuationToken: z.string().max(2000).optional(),
});
export type PublicGenerateInput = z.infer<typeof PublicGenerateSchema>;

export const PublicGenerateResultSchema = z.object({
  publicId: z.string(),
  previewUrl: z.string().url(),
  ctaUrl: z.string().url(),
  subject: z.string().nullable(),
  /** Pass back on the next generate call to keep the same free allowance. */
  continuationToken: z.string(),
  /** Free generations left in this conversation after the current one. */
  freeRemaining: z.number().int().min(0),
  /** Where to send the user to continue with a real account. */
  signInUrl: z.string().url(),
});
export type PublicGenerateResult = z.infer<typeof PublicGenerateResultSchema>;

/** Returned with HTTP 402 once the free allowance is spent. */
export const PublicGenerateGateSchema = z.object({
  requiresSignIn: z.literal(true),
  message: z.string(),
  signInUrl: z.string().url(),
});
export type PublicGenerateGate = z.infer<typeof PublicGenerateGateSchema>;
