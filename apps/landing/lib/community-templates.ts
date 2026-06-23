import { VariableSchemaRootSchema, type VariableSchemaRoot } from "@madoo/shared";
import { API_URL } from "./env";

export type LandingCommunityTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  categories: string[];
  previewUrl: string | null;
  authorName: string | null;
  variableCount: number;
  variables: VariableSchemaRoot["variables"];
};

const COMMUNITY_TEMPLATES_URL = `${API_URL.replace(/\/$/, "")}/public/community-templates`;

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toLandingTemplate(raw: unknown): LandingCommunityTemplate | null {
  if (!raw || typeof raw !== "object") return null;
  const template = raw as Record<string, unknown>;
  if (typeof template.id !== "string" || typeof template.name !== "string") {
    return null;
  }

  const variableSchema = VariableSchemaRootSchema.safeParse(
    template.variableSchema,
  );
  if (!variableSchema.success) return null;

  const category = nullableString(template.category);
  const rawCategories = Array.isArray(template.categories)
    ? template.categories.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  const categories =
    rawCategories.length > 0 ? rawCategories : category ? [category] : [];

  return {
    id: template.id,
    name: template.name,
    description: nullableString(template.description),
    category: category ?? categories[0] ?? null,
    categories,
    previewUrl: nullableString(template.previewUrl),
    authorName: nullableString(template.authorName),
    variableCount: variableSchema.data.variables.length,
    variables: variableSchema.data.variables,
  };
}

export async function fetchLandingCommunityTemplates(): Promise<
  LandingCommunityTemplate[]
> {
  try {
    const response = await fetch(COMMUNITY_TEMPLATES_URL, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];

    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];

    return data.flatMap((template) => {
      const parsed = toLandingTemplate(template);
      return parsed ? [parsed] : [];
    });
  } catch {
    return [];
  }
}
