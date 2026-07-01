import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateSupportTicketInputSchema } from "@madoo/shared";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService,
    private readonly mail: MailService,
  ) {}

  async createTicket(params: {
    userId: string;
    userEmail: string;
    workspaceHeader?: string;
    body: unknown;
  }) {
    const input = CreateSupportTicketInputSchema.parse(params.body);
    const workspaceId = input.workspaceId ?? params.workspaceHeader;

    let workspace: { id: string; name: string } | null = null;
    if (workspaceId) {
      await this.workspaces.assertMembership(params.userId, workspaceId);
      workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true },
      });
    }

    if (input.emailId) {
      const email = await this.prisma.email.findFirst({
        where: {
          id: input.emailId,
          workspace: { members: { some: { userId: params.userId } } },
        },
        include: { workspace: { select: { id: true, name: true } } },
      });
      if (!email) throw new BadRequestException("Email context not found.");
      if (workspace && email.workspaceId !== workspace.id) {
        throw new BadRequestException("Email context belongs to another workspace.");
      }
      workspace = workspace ?? email.workspace;
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId: params.userId,
        workspaceId: workspace?.id,
        emailId: input.emailId,
        contactEmail: input.contactEmail,
        category: input.category,
        subject: input.subject.trim(),
        message: input.message.trim(),
      },
    });
    try {
      await this.prisma.productEvent.create({
        data: {
          userId: params.userId,
          workspaceId: ticket.workspaceId,
          name: "support.submitted",
          source: "support.contact",
          properties: { ticketId: ticket.id, category: ticket.category },
        },
      });
    } catch {
      // Support tickets must still reach the team if analytics misses a row.
    }

    await this.mail.sendSupportTicket({
      id: ticket.id,
      contactEmail: ticket.contactEmail,
      category: ticket.category,
      subject: ticket.subject,
      message: ticket.message,
      userEmail: params.userEmail,
      workspaceName: workspace?.name,
    });

    return ticket;
  }
}

export function getWorkspaceHeader(
  raw: string | string[] | undefined,
): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value || undefined;
}
