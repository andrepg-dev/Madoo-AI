import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AskMadooInputSchema } from "@madoo/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CurrentWorkspace } from "../workspaces/current-workspace.decorator";
import { WorkspaceGuard, type WorkspaceContext } from "../workspaces/workspace.guard";
import { AssistantService } from "./assistant.service";

@Controller({ path: "assistant", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post("ask")
  ask(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Body() body: unknown,
  ) {
    const dto = AskMadooInputSchema.parse(body);
    return this.assistant.ask(workspace.id, user.sub, dto.question);
  }
}
