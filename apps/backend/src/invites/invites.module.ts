import { Module, forwardRef } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { InvitesController } from "./invites.controller";

@Module({
  imports: [AuthModule, forwardRef(() => WorkspacesModule)],
  controllers: [InvitesController],
})
export class InvitesModule {}
