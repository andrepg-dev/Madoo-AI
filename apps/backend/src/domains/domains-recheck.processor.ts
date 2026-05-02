import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { DomainsService } from "./domains.service";
import {
  DOMAIN_DNS_RECHECK_JOB,
  DOMAIN_DNS_RECHECK_QUEUE,
  type DomainDnsRecheckJobPayload,
} from "./domains-recheck.types";

@Injectable()
@Processor(DOMAIN_DNS_RECHECK_QUEUE)
export class DomainsRecheckProcessor extends WorkerHost {
  private readonly logger = new Logger(DomainsRecheckProcessor.name);

  constructor(private readonly domains: DomainsService) {
    super();
  }

  async process(job: Job<DomainDnsRecheckJobPayload>): Promise<void> {
    if (job.name !== DOMAIN_DNS_RECHECK_JOB) return;
    try {
      await this.domains.runRecheck(job.data.workspaceId, job.data.domainId);
    } catch (error) {
      this.logger.error("domain-dns-recheck failed", error instanceof Error ? error.stack : "");
      throw error;
    }
  }
}
