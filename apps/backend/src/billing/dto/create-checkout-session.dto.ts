import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";

export class CreateCheckoutSessionDto {
  @IsString()
  @IsIn(["BASIC", "MEDIUM", "PRO"])
  plan!: "BASIC" | "MEDIUM" | "PRO";

  @IsOptional()
  @IsString()
  @IsIn(["MONTHLY", "ANNUAL"])
  interval?: "MONTHLY" | "ANNUAL";

  /** Opt-in 7-day trial: when true, claim and grant the trial at checkout. */
  @IsOptional()
  @IsBoolean()
  claimTrial?: boolean;
}
