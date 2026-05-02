import { Type } from "class-transformer";
import { IsOptional, IsString, Max, Min } from "class-validator";

export class ListContactsQueryDto {
  @IsOptional()
  @IsString()
  segmentId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  pageSize?: number;
}
