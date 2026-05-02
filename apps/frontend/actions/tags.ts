import { z } from "zod";
import { TagSchema } from "@madoo/shared";
import { fetcher } from "@/lib/fetch";

const TagListSchema = z.array(TagSchema);

const CreateTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1).optional(),
});

export type CreateTagInput = z.infer<typeof CreateTagSchema>;

export const tagsKeys = {
  all: ["tags"] as const,
  list: () => [...tagsKeys.all, "list"] as const,
};

export const tagsApi = {
  list: async () => {
    const raw = await fetcher.get<unknown>("/tags");
    return TagListSchema.parse(raw);
  },
  create: async (input: CreateTagInput) => {
    const body = CreateTagSchema.parse(input);
    const raw = await fetcher.post<unknown, CreateTagInput>("/tags", body);
    return TagSchema.parse(raw);
  },
  remove: async (tagId: string) => {
    const raw = await fetcher.delete<unknown>(`/tags/${tagId}`);
    return z.object({ ok: z.boolean() }).parse(raw);
  },
};
