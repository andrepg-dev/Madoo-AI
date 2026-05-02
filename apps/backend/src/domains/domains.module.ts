import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { DomainsController } from "./domains.controller";
import { DomainsService } from "./domains.service";
import { DnsCheckerService } from "./dns-checker.service";
import { DomainsRecheckProcessor } from "./domains-recheck.processor";
import { DomainsRecheckScheduler } from "./domains-recheck.scheduler";
import { DOMAIN_DNS_RECHECK_QUEUE } from "./domains-recheck.types";

@Module({
  imports: [
    PrismaModule,
    WorkspacesModule,
    AuthModule,
    BullModule.registerQueue({ name: DOMAIN_DNS_RECHECK_QUEUE }),
  ],
  controllers: [DomainsController],
  providers: [
    DomainsService,
    DnsCheckerService,
    DomainsRecheckProcessor,
    DomainsRecheckScheduler,
  ],
  exports: [DomainsService],
})
export class DomainsModule {}
