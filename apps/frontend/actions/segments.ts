import { z } from "zod";
import {
  SegmentFromPromptInputSchema,
  SegmentFromPromptPreviewSchema,
  SegmentPreviewSchema,
  SegmentQuerySchema,
  SegmentSchema,
} from "@madoo/shared";
import { fetcher } from "@/lib/fetch";

const SegmentListSchema = z.array(SegmentSchema);

const CreateSegmentSchema = z.object({
  name: z.string().min(1),
  query: SegmentQuerySchema,
});

export type CreateSegmentInput = z.infer<typeof CreateSegmentSchema>;
export type SegmentFromPromptInput = z.infer<typeof SegmentFromPromptInputSchema>;
export type SegmentFromPromptPreview = z.infer<typeof SegmentFromPromptPreviewSchema>;

export const segmentsKeys = {
  all: ["segments"] as const,
  list: () => [...segmentsKeys.all, "list"] as const,
  detail: (segmentId: string) => [...segmentsKeys.all, "detail", segmentId] as const,
  preview: (segmentId: string) => [...segmentsKeys.all, "preview", segmentId] as const,
};

export const segmentsApi = {
  list: async () => {
    const raw = await fetcher.get<unknown>("/segments");
    return SegmentListSchema.parse(raw);
  },
  create: async (input: CreateSegmentInput) => {
    const body = CreateSegmentSchema.parse(input);
    const raw = await fetcher.post<unknown, CreateSegmentInput>("/segments", body);
    return SegmentSchema.parse(raw);
  },
  preview: async (segmentId: string) => {
    const raw = await fetcher.post<unknown, Record<string, never>>(
      `/segments/${segmentId}/preview`,
      {},
    );
    return SegmentPreviewSchema.parse(raw);
  },
  fromPrompt: async (input: SegmentFromPromptInput) => {
    const body = SegmentFromPromptInputSchema.parse(input);
    const raw = await fetcher.post<unknown, SegmentFromPromptInput>(
      "/segments/from-prompt",
      body,
    );
    return SegmentFromPromptPreviewSchema.parse(raw);
  },
};
