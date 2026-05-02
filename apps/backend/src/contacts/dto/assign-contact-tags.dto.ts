import { IsArray, IsString } from "class-validator";

export class AssignContactTagsDto {
  @IsArray()
  @IsString({ each: true })
  tagIds!: string[];
}
