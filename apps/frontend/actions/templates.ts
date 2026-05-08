import { fetcher } from "@/lib/fetch";
import {
  TemplateSeedPreviewDtoSchema,
  type TemplateSeedPreviewDto,
  type TemplateSlug,
} from "@madoo/shared";

export const templatesApi = {
  saveFromVariant: async (variantId: string, name: string): Promise<{ id: string; name: string; slug: string }> => {
    return fetcher.post("/templates/from-variant", { variantId, name });
  },
  previewSeed: async (slug: TemplateSlug): Promise<TemplateSeedPreviewDto> => {
    const raw = await fetcher.get<unknown>(`/templates/seed/${encodeURIComponent(slug)}/preview`);
    return TemplateSeedPreviewDtoSchema.parse(raw);
  },
};
