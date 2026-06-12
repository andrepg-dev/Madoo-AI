import { Module, forwardRef } from "@nestjs/common";
import { WorkspacesService } from "./workspaces.service";
import { WorkspacesController } from "./workspaces.controller";
import { WorkspacesCurrentController } from "./workspaces-current.controller";
import { WorkspaceGuard } from "./workspace.guard";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { S3Module } from "../s3/s3.module";
import { WorkspaceInvitesService } from "./workspace-invites.service";

@Module({
  imports: [forwardRef(() => AuthModule), MailModule, S3Module],
  controllers: [WorkspacesController, WorkspacesCurrentController],
  providers: [WorkspacesService, WorkspaceGuard, WorkspaceInvitesService],
  exports: [WorkspacesService, WorkspaceGuard, WorkspaceInvitesService],
})
export class WorkspacesModule {}
