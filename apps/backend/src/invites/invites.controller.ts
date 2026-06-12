import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { WorkspaceInvitePreview } from "@madoo/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  toAcceptWorkspaceInviteResponseDto,
  toWorkspaceInvitePreviewDto,
} from "../workspaces/dto/workspace-invite.dto";
import { WorkspaceInvitesService } from "../workspaces/workspace-invites.service";

@Controller({ path: "invites", version: "1" })
export class InvitesController {
  constructor(private readonly invites: WorkspaceInvitesService) {}

  @Get(":token")
  async preview(@Param("token") token: string): Promise<WorkspaceInvitePreview> {
    const invite = await this.invites.preview(token);
    return toWorkspaceInvitePreviewDto(invite);
  }

  @Post(":token/accept")
  @UseGuards(JwtAuthGuard)
  async accept(
    @Param("token") token: string,
    @CurrentUser() current: { sub: string },
  ) {
    const result = await this.invites.accept(token, current.sub);
    return toAcceptWorkspaceInviteResponseDto(
      result.workspace,
      result.membership,
    );
  }
}
