import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { AssistantController } from "./assistant.controller";
import { AssistantService } from "./assistant.service";

@Module({
  imports: [ConfigModule, AuthModule, PrismaModule, WorkspacesModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
