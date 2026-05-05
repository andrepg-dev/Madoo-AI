import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { TrackingController } from "./tracking.controller";
import { TrackingService } from "./tracking.service";

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
