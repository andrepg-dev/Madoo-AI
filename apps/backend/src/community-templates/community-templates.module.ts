import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BillingModule } from "../billing/billing.module";
import { EmailsModule } from "../emails/emails.module";
import { GenerationModule } from "../generation/generation.module";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { CommunityTemplatesController } from "./community-templates.controller";
import { CommunityTemplatesService } from "./community-templates.service";
import { PublicCommunityTemplatesController } from "./public-community-templates.controller";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    BillingModule,
    EmailsModule,
    GenerationModule,
  ],
  controllers: [
    CommunityTemplatesController,
    PublicCommunityTemplatesController,
  ],
  providers: [CommunityTemplatesService],
})
export class CommunityTemplatesModule {}
