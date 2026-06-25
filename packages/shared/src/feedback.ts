import { z } from "zod";

/** A 1–5 star rating. */
export const FeedbackRatingSchema = z.number().int().min(1).max(5);

export type FeedbackRating = z.infer<typeof FeedbackRatingSchema>;

/**
 * What a user submits from the in-app feedback widget. Lightweight by design:
 * a rating plus a free-text message. `page` records where it was sent from so
 * the admin can give it context; `workspaceId` is optional and resolved from
 * the request header when omitted.
 */
export const CreateFeedbackInputSchema = z.object({
  rating: FeedbackRatingSchema,
  message: z.string().trim().min(1).max(2000),
  page: z.string().max(512).optional(),
  workspaceId: z.string().min(1).optional(),
});

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackInputSchema>;

/** Full feedback record as returned to the admin panel. */
export const FeedbackSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email(),
  userName: z.string().nullable(),
  rating: FeedbackRatingSchema,
  message: z.string().min(1),
  page: z.string().nullable(),
  workspaceId: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type Feedback = z.infer<typeof FeedbackSchema>;

/** Paginated list payload for the admin feedback view. */
export const FeedbackListSchema = z.object({
  items: z.array(FeedbackSchema),
  total: z.number().int().nonnegative(),
});

export type FeedbackList = z.infer<typeof FeedbackListSchema>;
