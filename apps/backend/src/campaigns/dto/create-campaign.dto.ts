import { IsBoolean, IsDateString, IsEmail, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCampaignDto {
  @IsString()
  emailId!: string;

  @IsString()
  segmentId!: string;

  @IsString()
  @MaxLength(120)
  fromName!: string;

  @IsEmail()
  fromEmail!: string;

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
