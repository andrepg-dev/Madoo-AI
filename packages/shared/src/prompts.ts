import { z } from "zod";

export const PendingPromptSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  tone: z.string().nullable(),
  length: z.string().nullable(),
  audience: z.string().nullable(),
  /** Public S3 URLs of images attached on the landing prompt box, carried into
   * generation once the email is created. */
  imageUrls: z.array(z.string()).default([]),
  consumed: z.boolean(),
  createdAt: z.string().datetime(),
  /** Present after consume when a workspace Email row was created from this prompt */
  emailId: z.string().optional(),
});
export type PendingPrompt = z.infer<typeof PendingPromptSchema>;

export const CreatePendingPromptSchema = z.object({
  prompt: z.string().min(1).max(4000),
  tone: z.string().optional(),
  length: z.string().optional(),
  audience: z.string().optional(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
});
export type CreatePendingPromptInput = z.infer<typeof CreatePendingPromptSchema>;
