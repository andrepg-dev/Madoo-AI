import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateDomainDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  hostname!: string;
}
