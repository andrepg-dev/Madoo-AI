import {
  AskMadooInputSchema,
  AskMadooResponseSchema,
  type AskMadooInput,
  type AskMadooResponse,
} from "@madoo/shared";
import { fetcher } from "@/lib/fetch";

export type { AskMadooInput, AskMadooResponse };

export const assistantApi = {
  ask: async (input: AskMadooInput): Promise<AskMadooResponse> => {
    const body = AskMadooInputSchema.parse(input);
    const raw = await fetcher.post<unknown, AskMadooInput>("/assistant/ask", body);
    return AskMadooResponseSchema.parse(raw);
  },
};
