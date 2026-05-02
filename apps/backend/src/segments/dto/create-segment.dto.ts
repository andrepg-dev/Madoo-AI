import { IsNotEmpty, IsObject, IsString } from "class-validator";

export class CreateSegmentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  query!: unknown;
}
