import { z } from "zod";

export const SendTestEmailInputSchema = z.object({
  to: z.string().email().optional(),
});

export type SendTestEmailInput = z.infer<typeof SendTestEmailInputSchema>;

export const SendTestEmailResponseSchema = z.object({
  ok: z.literal(true),
  to: z.string().email(),
  skipped: z.boolean(),
});

export type SendTestEmailResponse = z.infer<
  typeof SendTestEmailResponseSchema
>;
