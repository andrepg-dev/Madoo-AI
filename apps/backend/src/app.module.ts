import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PromptsModule } from "./prompts/prompts.module";
import { WorkspacesModule } from "./workspaces/workspaces.module";
import { EmailsModule } from "./emails/emails.module";
import { TemplatesModule } from "./templates/templates.module";
import { ContactsModule } from "./contacts/contacts.module";
import { TagsModule } from "./tags/tags.module";
import { SegmentsModule } from "./segments/segments.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    PromptsModule,
    EmailsModule,
    TemplatesModule,
    ContactsModule,
    TagsModule,
    SegmentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
