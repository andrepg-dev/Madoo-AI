import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { ContactsController } from "./contacts.controller";
import { ContactsImportProcessor } from "./contacts-import.processor";
import { CONTACTS_IMPORT_QUEUE } from "./contacts-import.types";
import { ContactsService } from "./contacts.service";

@Module({
  imports: [
    PrismaModule,
    WorkspacesModule,
    AuthModule,
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? "redis://localhost:6379" },
    }),
    BullModule.registerQueue({ name: CONTACTS_IMPORT_QUEUE }),
  ],
  controllers: [ContactsController],
  providers: [ContactsService, ContactsImportProcessor],
  exports: [ContactsService],
})
export class ContactsModule {}
