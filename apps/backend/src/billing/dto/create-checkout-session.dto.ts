import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateCheckoutSessionDto {
  @IsString()
  @IsIn(["BASIC", "MEDIUM", "PRO"])
  plan!: "BASIC" | "MEDIUM" | "PRO";

  @IsOptional()
  @IsString()
  @IsIn(["MONTHLY", "ANNUAL"])
  interval?: "MONTHLY" | "ANNUAL";
}
