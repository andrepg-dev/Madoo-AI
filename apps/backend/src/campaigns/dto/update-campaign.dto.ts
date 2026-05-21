import { IsBoolean, IsDateString, IsEmail, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  emailId?: string;

  @IsOptional()
  @IsString()
  segmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fromName?: string;

  @IsOptional()
  @IsEmail()
  fromEmail?: string;

  @IsOptional()
  @IsEmail()
  replyTo?: string;

  @IsOptional()
  @IsBoolean()
  abTest?: boolean;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsObject()
  variableMapping?: Record<string, string>;
}
