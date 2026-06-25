import { FeedbackSchema, type Feedback as SharedFeedback } from "@madoo/shared";
import type { Feedback, User } from "@prisma/client";

export type FeedbackDto = SharedFeedback;

type FeedbackWithUser = Feedback & {
  user?: Pick<User, "name"> | null;
};

export function toFeedbackDto(feedback: FeedbackWithUser): FeedbackDto {
  return FeedbackSchema.parse({
    id: feedback.id,
    userId: feedback.userId,
    userEmail: feedback.userEmail,
    userName: feedback.user?.name ?? null,
    rating: feedback.rating,
    message: feedback.message,
    page: feedback.page,
    workspaceId: feedback.workspaceId,
    createdAt: feedback.createdAt.toISOString(),
  });
}
