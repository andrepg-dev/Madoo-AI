import { z } from "zod";

/**
 * Anonymous email generation used by the MCP acquisition tool. No user auth —
 * the MCP server presents a service token. Rate-limited per IP + global cap.
 */
export const PublicGenerateSchema = z.object({
  brief: z.string().trim().min(5).max(2000),
  brandName: z.string().trim().max(120).optional(),
  brandUrl: z.string().url().max(500).optional(),
});
export type PublicGenerateInput = z.infer<typeof PublicGenerateSchema>;

export const PublicGenerateResultSchema = z.object({
  publicId: z.string(),
  previewUrl: z.string().url(),
  ctaUrl: z.string().url(),
  subject: z.string().nullable(),
});
export type PublicGenerateResult = z.infer<typeof PublicGenerateResultSchema>;
