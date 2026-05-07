import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import {
  CurrentWorkspace,
} from "../workspaces/current-workspace.decorator";
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
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() current: { sub: string },
    @Body() body: CreateCheckoutSessionDto,
  ) {
    return this.billing.createCheckoutSession(
      workspace.id,
      current.sub,
      body.plan,
      body.interval ?? "MONTHLY",
    );
  }

  @Post("portal-session")
  createPortalSession(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() current: { sub: string },
  ) {
    return this.billing.createPortalSession(workspace.id, current.sub);
  }
}
