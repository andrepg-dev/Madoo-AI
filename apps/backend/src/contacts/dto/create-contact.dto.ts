import { IsEmail, IsIn, IsObject, IsOptional, IsString } from "class-validator";
import type { ContactStatus } from "@madoo/shared";

const CONTACT_STATUS_VALUES: ContactStatus[] = [
  "active",
  "unsubscribed",
  "bounced",
  "complained",
];

export class CreateContactDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsIn(CONTACT_STATUS_VALUES)
  status?: ContactStatus;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, string>;
}
