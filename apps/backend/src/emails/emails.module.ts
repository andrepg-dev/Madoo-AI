import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { AuthModule } from "../auth/auth.module";
import { GenerationModule } from "../generation/generation.module";
import { TemplatesModule } from "../templates/templates.module";
import { EmailsController } from "./emails.controller";
import { EmailsService } from "./emails.service";

@Module({
  imports: [PrismaModule, WorkspacesModule, AuthModule, GenerationModule, TemplatesModule],
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
