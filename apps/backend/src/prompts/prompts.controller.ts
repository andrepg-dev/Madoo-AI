import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
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
    return this.prompts.create(user.sub, dto);
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
