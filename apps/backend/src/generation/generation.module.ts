import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { S3Module } from "../s3/s3.module";
import { BillingModule } from "../billing/billing.module";
import { GenerationService } from "./generation.service";
import { ReactToHtmlService } from "./react-to-html.service";
import { ScreenshotService } from "./screenshot.service";
import { WebsiteBrandService } from "./website-brand.service";
import { ConversationTitleAgent } from "./conversation-title.agent";

@Module({
  imports: [ConfigModule, PrismaModule, S3Module, BillingModule],
  providers: [
    GenerationService,
    ReactToHtmlService,
    ScreenshotService,
    WebsiteBrandService,
    ConversationTitleAgent,
  ],
  exports: [GenerationService, ReactToHtmlService, ScreenshotService],
})
export class GenerationModule {}
