import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { TranscriptionController } from "./transcription.controller";
import { TranscriptionService } from "./transcription.service";

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [TranscriptionController],
  providers: [TranscriptionService],
})
export class TranscriptionModule {}
