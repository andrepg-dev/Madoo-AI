import { Body, Controller, Headers, Post, UseGuards } from "@nestjs/common";
import { WORKSPACE_HEADER } from "@madoo/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { toSupportTicketDto, type SupportTicketDto } from "./dto/support.dto";
import { getWorkspaceHeader, SupportService } from "./support.service";

@Controller({ path: "support", version: "1" })
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post("contact")
  async contact(
    @CurrentUser() current: { sub: string; email: string },
    @Headers(WORKSPACE_HEADER) rawWorkspaceHeader: string | string[] | undefined,
    @Body() body: unknown,
  ): Promise<SupportTicketDto> {
    const ticket = await this.support.createTicket({
      userId: current.sub,
      userEmail: current.email,
      workspaceHeader: getWorkspaceHeader(rawWorkspaceHeader),
      body,
    });
    return toSupportTicketDto(ticket);
  }
}
