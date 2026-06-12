"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  SaveTemplateFromVariantSchema,
  SavedTemplateDtoSchema,
  TemplateListDtoSchema,
  TemplateSeedPreviewDtoSchema,
  TemplateSlugSchema,
  type SaveTemplateFromVariantInput,
  type SavedTemplateDto,
  type TemplateDto,
  type TemplateSeedPreviewDto,
  type TemplateSlug,
} from "@madoo/shared";

export type {
  SaveTemplateFromVariantInput,
  SavedTemplateDto,
  TemplateDto,
  TemplateSeedPreviewDto,
  TemplateSlug,
} from "@madoo/shared";

export async function fetchTemplates(): Promise<TemplateDto[]> {
  const raw = await FetchWrapper<unknown>("/templates");
  return TemplateListDtoSchema.parse(raw);
}

export async function previewSeedTemplate(
  slug: TemplateSlug,
): Promise<TemplateSeedPreviewDto> {
  const parsedSlug = TemplateSlugSchema.parse(slug);
  const raw = await FetchWrapper<unknown>(
    `/templates/seed/${encodeURIComponent(parsedSlug)}/preview`,
  );
  return TemplateSeedPreviewDtoSchema.parse(raw);
}

export async function saveTemplateFromVariant(
  input: SaveTemplateFromVariantInput,
): Promise<SavedTemplateDto> {
  const body = SaveTemplateFromVariantSchema.parse(input);
  const raw = await FetchWrapper<unknown>("/templates/from-variant", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return SavedTemplateDtoSchema.parse(raw);
}
