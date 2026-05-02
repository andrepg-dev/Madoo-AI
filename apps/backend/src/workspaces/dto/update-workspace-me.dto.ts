import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateWorkspaceMeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  postalAddress!: string;
}
