import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateCheckoutSessionDto {
  @IsString()
  @IsIn(["STARTER", "GROWTH", "PRO"])
  plan!: "STARTER" | "GROWTH" | "PRO";

  @IsOptional()
  @IsString()
  @IsIn(["MONTHLY", "ANNUAL"])
  interval?: "MONTHLY" | "ANNUAL";
}
