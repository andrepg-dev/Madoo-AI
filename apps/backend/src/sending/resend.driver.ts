import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import type { SendBatchItem, SendBatchResult, SendingProvider } from "./sending-provider.interface";

@Injectable()
export class ResendDriver implements SendingProvider {
  private readonly client: Resend | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    if (!apiKey) {
      // Keep app booting in dev flows that do not send emails.
      this.client = null;
      return;
    }
    this.client = new Resend(apiKey);
  }

  async sendBatch(batch: SendBatchItem[]): Promise<SendBatchResult> {
    if (batch.length === 0) throw new BadRequestException("Empty send batch.");
    if (!this.client) {
      throw new InternalServerErrorException("Sending is not configured: RESEND_API_KEY is missing.");
    }
    const client = this.client;
    const ids = await Promise.all(
      batch.map(async (item) => {
        const response = await client.emails.send({
          from: item.from,
          to: item.to,
          subject: item.subject,
          html: item.html,
          replyTo: item.replyTo,
          headers: item.headers,
        });
        const id = response.data?.id;
        if (id) return id;

        const err = response.error as { name?: string; message?: string } | null | undefined;
        const detail = err?.message ?? err?.name ?? "Unknown Resend error";
        const recipient = Array.isArray(item.to) ? item.to.join(", ") : item.to;
        throw new InternalServerErrorException(
          `Resend rejected message to ${recipient} from ${item.from}: ${detail}`,
        );
      }),
    );
    return { messageIds: ids };
  }

  async parseWebhook(req: unknown): Promise<unknown> {
    return req;
  }
}
