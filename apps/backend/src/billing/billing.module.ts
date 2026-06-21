import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { ReferralsModule } from "../referrals/referrals.module";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { StripeService } from "./stripe.service";
import { StripeWebhookController } from "./stripe-webhook.controller";
import { TrialClaimController } from "./trial-claim.controller";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    ReferralsModule,
  ],
  controllers: [BillingController, StripeWebhookController, TrialClaimController],
  providers: [BillingService, StripeService],
  exports: [BillingService],
})
export class BillingModule {}
