import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { DomainsService } from "./domains.service";

@Injectable()
export class DomainsRecheckScheduler {
  private readonly logger = new Logger(DomainsRecheckScheduler.name);

  constructor(private readonly domains: DomainsService) {}

  @Cron("0 */15 * * * *")
  async enqueuePendingRechecks(): Promise<void> {
    try {
      await this.domains.enqueueAllPendingDomains();
    } catch (error) {
      this.logger.error(
        "Failed to enqueue pending domain rechecks.",
        error instanceof Error ? error.stack : "",
      );
    }
  }
}
