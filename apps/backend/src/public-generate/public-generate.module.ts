import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailsModule } from "../emails/emails.module";
import { GenerationModule } from "../generation/generation.module";
import { PublicGenerateController } from "./public-generate.controller";
import { PublicGenerateService } from "./public-generate.service";
import { AnonRateLimiter } from "./anon-rate-limit";
import { AnonSessionService } from "./anon-session.service";

@Module({
  imports: [PrismaModule, EmailsModule, GenerationModule],
  controllers: [PublicGenerateController],
  providers: [PublicGenerateService, AnonRateLimiter, AnonSessionService],
})
export class PublicGenerateModule {}
