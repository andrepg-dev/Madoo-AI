import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { S3Module } from "../s3/s3.module";
import { GenerationService } from "./generation.service";
import { ReactToHtmlService } from "./react-to-html.service";
import { ScreenshotService } from "./screenshot.service";

@Module({
  imports: [ConfigModule, PrismaModule, S3Module],
  providers: [GenerationService, ReactToHtmlService, ScreenshotService],
  exports: [GenerationService, ReactToHtmlService, ScreenshotService],
})
export class GenerationModule {}
