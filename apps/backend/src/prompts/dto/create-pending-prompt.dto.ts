import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class CreatePendingPromptDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  prompt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  tone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  length?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  audience?: string;
}
