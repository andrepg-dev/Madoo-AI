import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";
import {
  CreateWorkspaceInviteInputSchema,
  PLAN_DISPLAY_NAMES,
  PLAN_LIMITS,
} from "@madoo/shared";
import type { Prisma, Role } from "@prisma/client";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { planForWorkspace } from "../billing/account";

@Injectable()
export class WorkspaceInvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async list(workspaceId: string) {
    return this.prisma.workspaceInvite.findMany({
      where: { workspaceId },
      include: { invitedBy: true, acceptedBy: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(params: {
    workspaceId: string;
    invitedByUserId: string;
    body: unknown;
  }) {
    const input = CreateWorkspaceInviteInputSchema.parse(params.body);
    const email = input.email?.toLowerCase();
    const role = input.role as Role;

    await this.assertSeatAvailable(params.workspaceId, { countPending: true });

    if (email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existingUser) {
        const existingMember = await this.prisma.membership.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: params.workspaceId,
              userId: existingUser.id,
            },
          },
        });
        if (existingMember) {
          throw new BadRequestException("That user is already a member.");
        }
      }

      const duplicate = await this.prisma.workspaceInvite.findFirst({
        where: {
          workspaceId: params.workspaceId,
          email,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (duplicate) {
        throw new BadRequestException("A pending invite already exists.");
      }
    }

    const invite = await this.prisma.workspaceInvite.create({
      data: {
        workspaceId: params.workspaceId,
        invitedByUserId: params.invitedByUserId,
        email,
        role,
        token: randomBytes(32).toString("base64url"),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      include: { workspace: true, invitedBy: true, acceptedBy: true },
    });

    if (invite.email) {
      await this.mail.sendWorkspaceInvite({
        to: invite.email,
        workspaceName: invite.workspace.name,
        inviterName: invite.invitedBy.name ?? invite.invitedBy.email,
        inviteUrl: this.buildInviteUrl(invite.token),
        role: invite.role,
      });
    }

    return invite;
  }

  async delete(workspaceId: string, inviteId: string): Promise<void> {
    const invite = await this.prisma.workspaceInvite.findFirst({
      where: { id: inviteId, workspaceId },
    });
    if (!invite) throw new NotFoundException("Invite not found.");
    if (invite.acceptedAt) {
      throw new BadRequestException("Accepted invites cannot be deleted.");
    }
    await this.prisma.workspaceInvite.delete({ where: { id: invite.id } });
  }

  async preview(token: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: true, invitedBy: true },
    });
    this.assertPreviewable(invite);
    return invite;
  }

  async accept(token: string, userId: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: true },
    });
    if (!invite) throw new NotFoundException("Invite not found.");
    if (invite.expiresAt.getTime() <= Date.now()) {
      throw new GoneException("Invite has expired.");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found.");

    if (invite.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenException("Invite belongs to another email.");
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.membership.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: invite.workspaceId,
            userId,
          },
        },
      });

      // Final seat guard at the point a membership is actually created (covers
      // link invites accepted by many people). Existing members re-accepting pass.
      if (!existing) {
        await this.assertSeatAvailable(invite.workspaceId, {
          countPending: false,
          tx,
        });
      }

      const membership =
        existing ??
        (await tx.membership.create({
          data: {
            workspaceId: invite.workspaceId,
            userId,
            role: invite.role,
          },
        }));

      if (!invite.acceptedAt) {
        await tx.workspaceInvite.update({
          where: { id: invite.id },
          data: { acceptedAt: new Date(), acceptedByUserId: userId },
        });
      } else if (invite.acceptedByUserId !== userId) {
        throw new GoneException("Invite has already been accepted.");
      }

      return { workspace: invite.workspace, membership };
    });
  }

  /**
   * Guards the workspace member seat cap (owner + plan `members` allowance).
   * `countPending` also reserves seats for outstanding unaccepted invites.
   */
  private async assertSeatAvailable(
    workspaceId: string,
    opts: { countPending: boolean; tx?: Prisma.TransactionClient },
  ): Promise<void> {
    const db = opts.tx ?? this.prisma;
    const plan = await planForWorkspace(db, workspaceId);
    const limit = PLAN_LIMITS[plan].members;
    if (limit === -1) return;
    const allowed = 1 + limit; // owner + invited members
    const [members, pending] = await Promise.all([
      db.membership.count({ where: { workspaceId } }),
      opts.countPending
        ? db.workspaceInvite.count({
            where: {
              workspaceId,
              acceptedAt: null,
              expiresAt: { gt: new Date() },
            },
          })
        : Promise.resolve(0),
    ]);
    if (members + pending >= allowed) {
      const allowance =
        limit === 0
          ? "no additional members"
          : `${limit} member${limit === 1 ? "" : "s"}`;
      throw new ForbiddenException(
        `Member limit reached: ${PLAN_DISPLAY_NAMES[plan]} plan allows ${allowance} beyond the owner. Upgrade to invite more.`,
      );
    }
  }

  buildInviteUrl(token: string): string {
    const appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3003";
    return `${appUrl.replace(/\/$/, "")}/invite/${encodeURIComponent(token)}`;
  }

  private assertPreviewable<T extends { expiresAt: Date; acceptedAt: Date | null }>(
    invite: T | null,
  ): asserts invite is T {
    if (!invite) throw new NotFoundException("Invite not found.");
    if (invite.expiresAt.getTime() <= Date.now()) {
      throw new GoneException("Invite has expired.");
    }
    if (invite.acceptedAt) {
      throw new GoneException("Invite has already been accepted.");
    }
  }
}
