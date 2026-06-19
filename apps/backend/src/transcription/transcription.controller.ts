import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TranscriptionService } from "./transcription.service";

@Controller({ path: "transcription", version: "1" })
@UseGuards(JwtAuthGuard)
export class TranscriptionController {
  constructor(private readonly transcription: TranscriptionService) {}

  @Post()
  @UseInterceptors(FileInterceptor("audio"))
  transcribe(@UploadedFile() file: Express.Multer.File | undefined) {
    return this.transcription.transcribe(file);
  }
}
