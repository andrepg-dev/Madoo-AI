import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  /**
   * Optional pending prompt to attach to the user upon first sign-in.
   * Captured client-side when the unauthenticated user tries to send a prompt.
   */
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  pendingPrompt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  pendingTone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  pendingLength?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  pendingAudience?: string;
}
