import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

type SupportTicketMailInput = {
  id: string;
  contactEmail: string;
  category: string;
  subject: string;
  message: string;
  userEmail: string;
  workspaceName?: string | null;
};

type WorkspaceInviteMailInput = {
  to: string;
  workspaceName: string;
  inviterName: string;
  inviteUrl: string;
  role: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendSupportTicket(input: SupportTicketMailInput): Promise<void> {
    const to = this.config.get<string>("SUPPORT_EMAIL_TO");
    if (!to) {
      this.logger.warn("SUPPORT_EMAIL_TO not set; support email skipped.");
      return;
    }

    await this.sendEmail({
      to,
      subject: `[Madoo support] ${input.subject}`,
      text: [
        `Ticket: ${input.id}`,
        `Category: ${input.category}`,
        `Contact: ${input.contactEmail}`,
        `User: ${input.userEmail}`,
        input.workspaceName ? `Workspace: ${input.workspaceName}` : null,
        "",
        input.message,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  async sendWorkspaceInvite(input: WorkspaceInviteMailInput): Promise<void> {
    await this.sendEmail({
      to: input.to,
      subject: `${input.inviterName} invited you to ${input.workspaceName}`,
      text: [
        `${input.inviterName} invited you to join ${input.workspaceName} as ${input.role}.`,
        "",
        input.inviteUrl,
      ].join("\n"),
    });
  }

  private async sendEmail(input: SendEmailInput): Promise<void> {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    const from = this.config.get<string>("RESEND_FROM_EMAIL");

    if (!apiKey || !from) {
      this.logger.warn("Resend env missing; email skipped.");
      return;
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: input.to,
          subject: input.subject,
          text: input.text,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        this.logger.warn(
          `Resend email failed with ${res.status}: ${body.slice(0, 240)}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Resend email failed: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }
}
