import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CreatePendingPromptSchema } from "@madoo/shared";
import { PromptsService } from "./prompts.service";
import { CreatePendingPromptDto } from "./dto/create-pending-prompt.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller({ path: "prompts/pending", version: "1" })
@UseGuards(JwtAuthGuard)
export class PromptsController {
  constructor(private readonly prompts: PromptsService) {}

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreatePendingPromptDto) {
    const input = CreatePendingPromptSchema.parse(dto);
    return this.prompts.create(user.sub, input);
  }

  // Upload a landing prompt-box image attachment (auth only, no workspace) so
  // the resulting public URL can ride the cross-subdomain handoff into the app.
  @Post("attachments")
  @UseInterceptors(FileInterceptor("file"))
  uploadAttachment(@UploadedFile() file: Express.Multer.File | undefined) {
    return this.prompts.uploadAttachment(file);
  }

  @Get()
  list(@CurrentUser() user: { sub: string }) {
    return this.prompts.listForUser(user.sub);
  }

  @Post(":id/consume")
  consume(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return this.prompts.consume(user.sub, id);
  }
}
