import { z } from "zod";

export const PendingPromptSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  tone: z.string().nullable(),
  length: z.string().nullable(),
  audience: z.string().nullable(),
  consumed: z.boolean(),
  createdAt: z.string().datetime(),
});
export type PendingPrompt = z.infer<typeof PendingPromptSchema>;

export const CreatePendingPromptSchema = z.object({
  prompt: z.string().min(1).max(4000),
  tone: z.string().optional(),
  length: z.string().optional(),
  audience: z.string().optional(),
});
export type CreatePendingPromptInput = z.infer<typeof CreatePendingPromptSchema>;
