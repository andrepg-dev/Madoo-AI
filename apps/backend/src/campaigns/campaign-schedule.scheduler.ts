import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { CampaignsService } from "./campaigns.service";

@Injectable()
export class CampaignScheduleScheduler {
  private readonly logger = new Logger(CampaignScheduleScheduler.name);

  constructor(private readonly campaigns: CampaignsService) {}

  @Cron("* * * * *")
  async dispatchScheduledCampaigns(): Promise<void> {
    try {
      await this.campaigns.enqueueScheduledCampaigns();
    } catch (error) {
      this.logger.error(
        "Failed to dispatch scheduled campaigns.",
        error instanceof Error ? error.stack : "",
      );
    }
  }
}
