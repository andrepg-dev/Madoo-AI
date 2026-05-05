import { IsIn, IsString } from "class-validator";

export class CreateCheckoutSessionDto {
  @IsString()
  @IsIn(["STARTER", "GROWTH"])
  plan!: "STARTER" | "GROWTH";
}
