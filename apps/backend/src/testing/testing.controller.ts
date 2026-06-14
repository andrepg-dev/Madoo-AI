import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import {
  SendTestEmailInputSchema,
  type SendTestEmailResponse,
  type TestLinksResponse,
  type TestSpamResponse,
} from "@madoo/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  WorkspaceGuard,
  type WorkspaceScopedRequest,
} from "../workspaces/workspace.guard";
import { TestingService } from "./testing.service";

@Controller({ path: "emails", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class TestingController {
  constructor(private readonly testing: TestingService) {}

  @Post(":id/test/send")
  send(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { email: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ): Promise<SendTestEmailResponse> {
    const parsed = SendTestEmailInputSchema.parse(body ?? {});
    return this.testing.sendTestEmail({
      emailId: id,
      workspaceId: req.workspace.id,
      userEmail: user.email,
      body: parsed,
    });
  }

  @Post(":id/test/links")
  checkLinks(
    @Req() req: WorkspaceScopedRequest,
    @Param("id") id: string,
  ): Promise<TestLinksResponse> {
    return this.testing.checkLinks(id, req.workspace.id);
  }

  @Post(":id/test/spam")
  checkSpam(
    @Req() req: WorkspaceScopedRequest,
    @Param("id") id: string,
  ): Promise<TestSpamResponse> {
    return this.testing.checkSpam(id, req.workspace.id);
  }
}
