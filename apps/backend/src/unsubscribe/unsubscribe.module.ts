import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { UnsubscribeController } from "./unsubscribe.controller";
import { UnsubscribeService } from "./unsubscribe.service";

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [UnsubscribeController],
  providers: [UnsubscribeService],
})
export class UnsubscribeModule {}
