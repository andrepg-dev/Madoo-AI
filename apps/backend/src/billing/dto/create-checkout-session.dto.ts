import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateCheckoutSessionDto {
  @IsString()
  @IsIn(["STARTER", "GROWTH"])
  plan!: "STARTER" | "GROWTH";

  @IsOptional()
  @IsString()
  @IsIn(["MONTHLY", "ANNUAL"])
  interval?: "MONTHLY" | "ANNUAL";
}
