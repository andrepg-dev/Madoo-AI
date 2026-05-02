import { IsNotEmpty, IsString } from "class-validator";

export class SegmentFromPromptDto {
  @IsString()
  @IsNotEmpty()
  prompt!: string;
}
