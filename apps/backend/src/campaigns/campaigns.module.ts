import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AuthModule } from "../auth/auth.module";
import { GenerationModule } from "../generation/generation.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SendingModule } from "../sending/sending.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { BillingModule } from "../billing/billing.module";
import { CampaignSendProcessor } from "./campaign-send.processor";
import { CampaignScheduleScheduler } from "./campaign-schedule.scheduler";
import { CAMPAIGN_SEND_QUEUE } from "./campaign-send.types";
import { CampaignsController } from "./campaigns.controller";
import { CampaignsService } from "./campaigns.service";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    BillingModule,
    GenerationModule,
    SendingModule,
    BullModule.registerQueue({ name: CAMPAIGN_SEND_QUEUE }),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignSendProcessor, CampaignScheduleScheduler],
  exports: [CampaignsService],
})
export class CampaignsModule {}
