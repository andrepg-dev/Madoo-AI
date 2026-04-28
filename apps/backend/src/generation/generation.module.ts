import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { GenerationService } from "./generation.service";
import { ReactToHtmlService } from "./react-to-html.service";

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [GenerationService, ReactToHtmlService],
  exports: [GenerationService, ReactToHtmlService],
})
export class GenerationModule {}
