import { Module } from "@nestjs/common";
import { PromptsService } from "./prompts.service";
import { PromptsController } from "./prompts.controller";
import { AuthModule } from "../auth/auth.module";
import { EmailsModule } from "../emails/emails.module";
import { GenerationModule } from "../generation/generation.module";

@Module({
  imports: [AuthModule, EmailsModule, GenerationModule],
  providers: [PromptsService],
  controllers: [PromptsController],
})
export class PromptsModule {}
