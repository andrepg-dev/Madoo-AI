import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  type CreateWorkspaceInviteInput,
  type WorkspaceInvite,
  UpdateMemberRoleInputSchema,
  UpdateWorkspaceInputSchema,
} from "@madoo/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { S3Service } from "../s3/s3.service";
import { CurrentWorkspace } from "./current-workspace.decorator";
import {
  toWorkspaceDto,
  toWorkspaceMemberDto,
  type WorkspaceDto,
  type WorkspaceMemberDto,
} from "./dto/workspace.dto";
import {
  toWorkspaceInviteDto,
} from "./dto/workspace-invite.dto";
import {
  WorkspaceGuard,
  type WorkspaceContext,
} from "./workspace.guard";
import { WorkspacesService } from "./workspaces.service";
import { WorkspaceInvitesService } from "./workspace-invites.service";

@Controller({ path: "workspaces/current", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class WorkspacesCurrentController {
  constructor(
    private readonly workspaces: WorkspacesService,
    private readonly invites: WorkspaceInvitesService,
    private readonly s3: S3Service,
  ) {}

  @Patch()
  async updateCurrent(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body() body: unknown,
  ): Promise<WorkspaceDto> {
    this.workspaces.assertRole(workspace.role, "ADMIN");
    const input = UpdateWorkspaceInputSchema.parse(body);
    const updated = await this.workspaces.updateWorkspace(workspace.id, input);
    return toWorkspaceDto(updated);
  }

  @Post("avatar")
  @UseInterceptors(FileInterceptor("file"))
  async uploadAvatar(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<WorkspaceDto> {
    this.workspaces.assertRole(workspace.role, "ADMIN");
    if (!file) throw new BadRequestException("Avatar file is required.");

    const avatarUrl = await this.s3.uploadBuffer(
      file.buffer,
      file.mimetype,
      "workspace-avatars",
    );
    const updated = await this.workspaces.setWorkspaceAvatar(
      workspace.id,
      avatarUrl,
    );
    return toWorkspaceDto(updated);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCurrent(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() current: { sub: string },
  ): Promise<void> {
    this.workspaces.assertRole(workspace.role, "OWNER");
    await this.workspaces.deleteWorkspace(current.sub, workspace.id);
  }

  @Post("leave")
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveCurrent(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() current: { sub: string },
  ): Promise<void> {
    await this.workspaces.leaveWorkspace(current.sub, workspace.id);
  }

  @Get("members")
  async listMembers(
    @CurrentWorkspace() workspace: WorkspaceContext,
  ): Promise<WorkspaceMemberDto[]> {
    const rows = await this.workspaces.listMembers(workspace.id);
    return rows.map(toWorkspaceMemberDto);
  }

  @Patch("members/:userId")
  async updateMemberRole(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("userId") userId: string,
    @Body() body: unknown,
  ): Promise<WorkspaceMemberDto> {
    this.workspaces.assertRole(workspace.role, "OWNER");
    const input = UpdateMemberRoleInputSchema.parse(body);
    const member = await this.workspaces.updateMemberRole(
      workspace.id,
      userId,
      input.role,
    );
    return toWorkspaceMemberDto(member);
  }

  @Delete("members/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("userId") userId: string,
  ): Promise<void> {
    this.workspaces.assertRole(workspace.role, "ADMIN");
    await this.workspaces.removeMember(workspace.id, userId);
  }

  @Get("invites")
  async listInvites(
    @CurrentWorkspace() workspace: WorkspaceContext,
  ): Promise<WorkspaceInvite[]> {
    this.workspaces.assertRole(workspace.role, "ADMIN");
    const rows = await this.invites.list(workspace.id);
    return rows.map((invite) =>
      toWorkspaceInviteDto(invite, this.invites.buildInviteUrl(invite.token)),
    );
  }

  @Post("invites")
  async createInvite(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() current: { sub: string },
    @Body() body: CreateWorkspaceInviteInput,
  ): Promise<WorkspaceInvite> {
    this.workspaces.assertRole(workspace.role, "ADMIN");
    const invite = await this.invites.create({
      workspaceId: workspace.id,
      invitedByUserId: current.sub,
      body,
    });
    return toWorkspaceInviteDto(
      invite,
      this.invites.buildInviteUrl(invite.token),
    );
  }

  @Delete("invites/:inviteId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInvite(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("inviteId") inviteId: string,
  ): Promise<void> {
    this.workspaces.assertRole(workspace.role, "ADMIN");
    await this.invites.delete(workspace.id, inviteId);
  }
}
