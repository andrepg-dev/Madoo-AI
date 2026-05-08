import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { TemplatesService } from "./templates.service";
import { TemplatesController } from "./templates.controller";
import { AuthModule } from "../auth/auth.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { GenerationModule } from "../generation/generation.module";

@Module({
  imports: [PrismaModule, AuthModule, WorkspacesModule, GenerationModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
