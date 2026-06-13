import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { TestingController } from "./testing.controller";
import { TestingService } from "./testing.service";

@Module({
  imports: [PrismaModule, AuthModule, WorkspacesModule, MailModule],
  controllers: [TestingController],
  providers: [TestingService],
})
export class TestingModule {}
