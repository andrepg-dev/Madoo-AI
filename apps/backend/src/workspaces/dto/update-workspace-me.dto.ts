import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateWorkspaceMeDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(500)
  postalAddress?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(80)
  templateCreationReason?: string;
}
