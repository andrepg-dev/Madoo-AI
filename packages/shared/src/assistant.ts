import { z } from "zod";

export const AskMadooInputSchema = z.object({
  question: z.string().trim().min(2).max(800),
});

export type AskMadooInput = z.infer<typeof AskMadooInputSchema>;

export const AskMadooResponseSchema = z.object({
  answer: z.string().min(1),
  generatedAt: z.string().datetime(),
});

export type AskMadooResponse = z.infer<typeof AskMadooResponseSchema>;
