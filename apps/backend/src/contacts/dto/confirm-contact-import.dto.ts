import { IsObject, IsString } from "class-validator";
import type { ContactImportColumnMapping } from "../contacts-import.types";

export class ConfirmContactImportDto {
  @IsObject()
  columnMapping!: ContactImportColumnMapping;
}

export function validateColumnMappingShape(
  input: ContactImportColumnMapping,
): ContactImportColumnMapping {
  const mapping = input ?? ({} as ContactImportColumnMapping);
  if (!mapping.email || typeof mapping.email !== "string") {
    throw new Error("columnMapping.email is required.");
  }
  if (mapping.firstName !== undefined && typeof mapping.firstName !== "string") {
    throw new Error("columnMapping.firstName must be a string.");
  }
  if (mapping.lastName !== undefined && typeof mapping.lastName !== "string") {
    throw new Error("columnMapping.lastName must be a string.");
  }
  return mapping;
}
