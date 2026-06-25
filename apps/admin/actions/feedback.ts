import { FeedbackListSchema, type FeedbackList } from "@madoo/shared";
import { adminFetch } from "@/lib/api";

export async function fetchFeedback(params: {
  page: number;
  pageSize: number;
}): Promise<FeedbackList> {
  const raw = await adminFetch<FeedbackList>(
    `/feedback?page=${params.page}&pageSize=${params.pageSize}`,
  );
  return FeedbackListSchema.parse(raw);
}
