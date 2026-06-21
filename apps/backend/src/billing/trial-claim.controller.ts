import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ClaimTrialEmailInputSchema } from "@madoo/shared";
import { BillingService } from "./billing.service";

/**
 * Public endpoint: a landing-page visitor reserves an opt-in 7-day trial by
 * email before signing up. Unauthenticated by design; the claim is reconciled
 * to the user on their next login.
 */
@Controller({ path: "trial-claims", version: "1" })
export class TrialClaimController {
  constructor(private readonly billing: BillingService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  claim(@Body() body: unknown) {
    const input = ClaimTrialEmailInputSchema.parse(body);
    return this.billing.recordTrialClaimEmail(input.email);
  }
}
