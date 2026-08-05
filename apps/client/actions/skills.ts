"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import { SkillListSchema, type SkillDto } from "@madoo/shared";

export type { SkillDto };

/** Design skills offered by the composer's skill picker. */
export async function fetchSkills(): Promise<SkillDto[]> {
  const raw = await FetchWrapper<SkillDto[]>("/skills");
  return SkillListSchema.parse(raw);
}
