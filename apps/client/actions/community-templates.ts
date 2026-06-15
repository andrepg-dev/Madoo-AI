"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  CommunityTemplateDetailDtoSchema,
  CommunityTemplateDtoSchema,
  CommunityTemplateListDtoSchema,
  EmailDtoSchema,
  SetCommunityTemplateStarredSchema,
  ShareEmailToCommunitySchema,
  UseCommunityTemplateSchema,
  type CommunityTemplateDetailDto,
  type CommunityTemplateDto,
  type EmailDto,
  type ShareEmailToCommunityInput,
  type VariableSchemaRoot,
} from "@madoo/shared";

export type {
  CommunityTemplateDetailDto,
  CommunityTemplateDto,
  ShareEmailToCommunityInput,
  VariableSchemaRoot,
} from "@madoo/shared";

export async function fetchCommunityTemplates(): Promise<
  CommunityTemplateDto[]
> {
  const raw = await FetchWrapper<unknown>("/community-templates");
  return CommunityTemplateListDtoSchema.parse(raw);
}

export async function fetchCommunityTemplate(
  id: string,
): Promise<CommunityTemplateDetailDto> {
  const raw = await FetchWrapper<unknown>(
    `/community-templates/${encodeURIComponent(id)}`,
  );
  return CommunityTemplateDetailDtoSchema.parse(raw);
}

export async function shareEmailToCommunity(
  input: ShareEmailToCommunityInput,
): Promise<CommunityTemplateDto> {
  const body = ShareEmailToCommunitySchema.parse(input);
  const raw = await FetchWrapper<unknown>("/community-templates", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return CommunityTemplateDtoSchema.parse(raw);
}

export async function useCommunityTemplate(
  id: string,
  variableSchema: VariableSchemaRoot,
): Promise<EmailDto> {
  const body = UseCommunityTemplateSchema.parse({ variableSchema });
  const raw = await FetchWrapper<unknown>(
    `/community-templates/${encodeURIComponent(id)}/use`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return EmailDtoSchema.parse(raw);
}

export async function setCommunityTemplateStarred(
  id: string,
  starred: boolean,
): Promise<CommunityTemplateDto> {
  const body = SetCommunityTemplateStarredSchema.parse({ starred });
  const raw = await FetchWrapper<unknown>(
    `/community-templates/${encodeURIComponent(id)}/star`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return CommunityTemplateDtoSchema.parse(raw);
}
