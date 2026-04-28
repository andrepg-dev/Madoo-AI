import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PromptsModule } from "./prompts/prompts.module";
import { WorkspacesModule } from "./workspaces/workspaces.module";
import { EmailsModule } from "./emails/emails.module";
import { TemplatesModule } from "./templates/templates.module";
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
  ],
  controllers: [HealthController],
})
export class AppModule {}
