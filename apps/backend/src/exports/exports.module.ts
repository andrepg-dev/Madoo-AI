import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { GenerationModule } from "../generation/generation.module";
import { ConnectionsModule } from "../connections/connections.module";
import { ExportsController } from "./exports.controller";
import { ExportsService } from "./exports.service";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    GenerationModule,
    ConnectionsModule,
  ],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
