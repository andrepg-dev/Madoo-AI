import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { S3Module } from "../s3/s3.module";
import { BillingModule } from "../billing/billing.module";
import { AuthModule } from "../auth/auth.module";
import { GenerationService } from "./generation.service";
import { GenerationLlmService } from "./generation.llm.service";
import { ReactToHtmlService } from "./react-to-html.service";
import { ScreenshotService } from "./screenshot.service";
import { WebsiteBrandService } from "./website-brand.service";
import { ConversationTitleAgent } from "./conversation-title.agent";
import { EmailVariantRetentionService } from "../emails/email-variant-retention.service";
import { EmailIconCatalogService } from "./email-icon-catalog.service";
import { SkillsController } from "./skills.controller";

@Module({
  imports: [ConfigModule, PrismaModule, S3Module, BillingModule, AuthModule],
  controllers: [SkillsController],
  providers: [
    GenerationLlmService,
    GenerationService,
    ReactToHtmlService,
    ScreenshotService,
    WebsiteBrandService,
    ConversationTitleAgent,
    EmailVariantRetentionService,
    EmailIconCatalogService,
  ],
  exports: [
    GenerationService,
    ReactToHtmlService,
    ScreenshotService,
    EmailVariantRetentionService,
  ],
})
export class GenerationModule {}
