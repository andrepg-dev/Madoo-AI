import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ResendDriver } from "./resend.driver";
import { SENDING_PROVIDER } from "./sending-provider.interface";

@Module({
  imports: [ConfigModule],
  providers: [
    ResendDriver,
    {
      provide: SENDING_PROVIDER,
      useExisting: ResendDriver,
    },
  ],
  exports: [SENDING_PROVIDER],
})
export class SendingModule {}
