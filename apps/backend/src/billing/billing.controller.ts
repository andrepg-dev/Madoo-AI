import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CurrentWorkspace } from "../workspaces/current-workspace.decorator";
import {
  WorkspaceGuard,
  type WorkspaceContext,
} from "../workspaces/workspace.guard";
import { BillingService } from "./billing.service";
import { CreateCheckoutSessionDto } from "./dto/create-checkout-session.dto";

@Controller({ path: "billing", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get("overview")
  overview(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() current: { sub: string },
  ) {
    return this.billing.getOverview(workspace.id, current.sub);
  }

  @Post("checkout-session")
  createCheckoutSession(
    @CurrentUser() current: { sub: string },
    @Body() body: CreateCheckoutSessionDto,
  ) {
    return this.billing.createCheckoutSession(
      current.sub,
      body.plan,
      body.interval ?? "MONTHLY",
      body.claimTrial ?? false,
    );
  }

  @Post("claim-trial")
  claimTrial(@CurrentUser() current: { sub: string }) {
    return this.billing.claimTrial(current.sub);
  }

  @Post("portal-session")
  createPortalSession(@CurrentUser() current: { sub: string }) {
    return this.billing.createPortalSession(current.sub);
  }

  @Post("cancel")
  cancelSubscription(@CurrentUser() current: { sub: string }) {
    return this.billing.setCancellation(current.sub, true);
  }

  @Post("resume")
  resumeSubscription(@CurrentUser() current: { sub: string }) {
    return this.billing.setCancellation(current.sub, false);
  }
}
