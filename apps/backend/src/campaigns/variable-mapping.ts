import type { CampaignVariableMapping, VariableSpec } from "@madoo/shared";

type ContactVariableSource = {
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export function sanitizeVariableMapping(value: unknown): CampaignVariableMapping {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: CampaignVariableMapping = {};
  for (const [name, field] of Object.entries(value as Record<string, unknown>)) {
    const key = name.trim();
    if (!key || typeof field !== "string") continue;
    const mappedField = field.trim();
    if (mappedField) result[key] = mappedField;
  }
  return result;
}

export function toStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "string") result[key] = entry;
  }
  return result;
}

export function resolveVariableValue(
  contact: ContactVariableSource,
  customFields: Record<string, string>,
  variable: VariableSpec,
  variableMapping: CampaignVariableMapping,
): string {
  const mapped = resolveMappedContactField(contact, customFields, variableMapping[variable.name]);
  if (mapped?.trim()) return mapped;

  const fromCustom = customFields[variable.name];
  if (fromCustom?.trim()) return fromCustom;
  if (variable.name === "email") return contact.email;
  if (variable.name === "firstName") return contact.firstName ?? variable.default;
  if (variable.name === "lastName") return contact.lastName ?? variable.default;
  return variable.default;
}

function resolveMappedContactField(
  contact: ContactVariableSource,
  customFields: Record<string, string>,
  mappedField: string | undefined,
): string | undefined {
  if (!mappedField) return undefined;
  if (mappedField === "contact.email") return contact.email;
  if (mappedField === "contact.firstName") return contact.firstName ?? undefined;
  if (mappedField === "contact.lastName") return contact.lastName ?? undefined;
  if (mappedField.startsWith("custom.")) return customFields[mappedField.slice("custom.".length)];
  return undefined;
}
