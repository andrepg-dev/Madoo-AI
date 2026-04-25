import { Module } from "@nestjs/common";
import { PromptsService } from "./prompts.service";
import { PromptsController } from "./prompts.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  providers: [PromptsService],
  controllers: [PromptsController],
})
export class PromptsModule {}
