"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  CreateFeedbackInputSchema,
  FeedbackSchema,
  type CreateFeedbackInput,
  type Feedback,
} from "@madoo/shared";

export type { CreateFeedbackInput, Feedback } from "@madoo/shared";

export async function createFeedback(
  input: CreateFeedbackInput,
): Promise<Feedback> {
  const body = CreateFeedbackInputSchema.parse(input);
  const raw = await FetchWrapper<Feedback>("/feedback", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return FeedbackSchema.parse(raw);
}
