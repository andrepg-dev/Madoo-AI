import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ReferralsService } from "./referrals.service";

@Controller({ path: "referrals", version: "1" })
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get("me")
  getMyReferral(@CurrentUser() current: { sub: string }) {
    return this.referrals.getMyReferral(current.sub);
  }
}
