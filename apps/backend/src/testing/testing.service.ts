import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  SendTestEmailResponseSchema,
  type SendTestEmailInput,
  type SendTestEmailResponse,
} from "@madoo/shared";
import juice from "juice";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TestingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async sendTestEmail(input: {
    emailId: string;
    workspaceId: string;
    userEmail: string;
    body: SendTestEmailInput;
  }): Promise<SendTestEmailResponse> {
    const to = input.body.to ?? input.userEmail;
    if (!to) {
      throw new BadRequestException("No recipient email available.");
    }

    const variant = await this.prisma.emailVariant.findFirst({
      where: { emailId: input.emailId, workspaceId: input.workspaceId },
      orderBy: { seq: "desc" },
      select: { subject: true, compiledHtml: true },
    });

    if (!variant) {
      throw new NotFoundException("Email variant not found for this workspace.");
    }

    const sent = await this.mail.sendTestEmail({
      to,
      subject: variant.subject,
      html: inlineCss(variant.compiledHtml),
    });

    return SendTestEmailResponseSchema.parse({
      ok: true,
      to,
      skipped: !sent,
    });
  }
}

function inlineCss(html: string): string {
  try {
    return juice(html);
  } catch {
    return html;
  }
}
