export type SendBatchItem = {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export type SendBatchResult = {
  messageIds: string[];
};

export interface SendingProvider {
  sendBatch(batch: SendBatchItem[]): Promise<SendBatchResult>;
  parseWebhook(req: unknown): Promise<unknown>;
}

export const SENDING_PROVIDER = "SENDING_PROVIDER";
