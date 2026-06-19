import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Membership, Role, Workspace } from "@prisma/client";
import { PLAN_DISPLAY_NAMES, PLAN_LIMITS, type Plan } from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(
    userId: string,
  ): Promise<Array<Workspace & { membership: Membership }>> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((m) => ({ ...m.workspace, membership: m }));
  }

  async assertMembership(
    userId: string,
    workspaceId: string,
  ): Promise<Membership> {
    const m = await this.prisma.membership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException("Not a member of this workspace.");
    return m;
  }

  async assertOwner(
    userId: string,
    workspaceId: string,
  ): Promise<Membership> {
    const m = await this.assertMembership(userId, workspaceId);
    if (m.role !== "OWNER" && m.role !== "ADMIN") {
      throw new ForbiddenException("Owner or admin role required.");
    }
    return m;
  }

  async findByIdForUser(userId: string, workspaceId: string) {
    const ws = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!ws) throw new NotFoundException("Workspace not found.");
    await this.assertMembership(userId, workspaceId);
    return ws;
  }

  async createForUser(userId: string, name: string): Promise<Workspace> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ForbiddenException("Workspace name is required.");
    }

    const [ownedCount, subs] = await Promise.all([
      this.prisma.membership.count({ where: { userId, role: "OWNER" } }),
      this.prisma.billingSubscription.findMany({
        where: { workspace: { members: { some: { userId, role: "OWNER" } } } },
        select: { plan: true },
      }),
    ]);

    const PLAN_RANK: Record<string, number> = {
      FREE: 0,
      BASIC: 1,
      MEDIUM: 2,
      PRO: 3,
    };
    const bestPlan = subs
      .map((s) => s.plan as string)
      .reduce(
        (best, plan) => ((PLAN_RANK[plan] ?? 0) > (PLAN_RANK[best] ?? 0) ? plan : best),
        "FREE",
      ) as Plan;

    const wsLimit = PLAN_LIMITS[bestPlan].workspaces;
    if (wsLimit !== -1 && ownedCount >= wsLimit) {
      throw new ForbiddenException(
        `Workspace limit: ${PLAN_DISPLAY_NAMES[bestPlan]} plan allows ${wsLimit} workspace${wsLimit === 1 ? "" : "s"}. Upgrade to create more.`,
      );
    }

    const baseSlug = slugifyName(trimmed);
    const slug = await this.uniqueSlug(baseSlug);
    return this.prisma.workspace.create({
      data: {
        name: trimmed,
        slug,
        members: { create: { userId, role: "OWNER" } },
      },
    });
  }

  async ensurePersonalWorkspace(params: {
    userId: string;
    displayName: string | null;
    email: string;
  }): Promise<Workspace> {
    const existing = await this.prisma.membership.findFirst({
      where: { userId: params.userId },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    if (existing) return existing.workspace;

    const baseSlug = slugifyEmail(params.email);
    const slug = await this.uniqueSlug(baseSlug);
    const name =
      params.displayName?.trim() || deriveNameFromEmail(params.email);

    const workspace = await this.prisma.workspace.create({
      data: {
        name: `${name}'s workspace`,
        slug,
        members: {
          create: { userId: params.userId, role: "OWNER" },
        },
      },
    });
    return workspace;
  }

  async updatePrimaryWorkspaceForUser(
    userId: string,
    input: { templateCreationReason?: string },
  ): Promise<Workspace & { membership: Membership }> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    if (!membership) throw new NotFoundException("Workspace not found.");

    const data: { templateCreationReason?: string } = {};
    if (input.templateCreationReason !== undefined) {
      data.templateCreationReason = input.templateCreationReason.trim();
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException("No workspace fields provided.");
    }

    const updated = await this.prisma.workspace.update({
      where: { id: membership.workspaceId },
      data,
    });
    return { ...updated, membership };
  }

  assertRole(role: Role, min: "ADMIN" | "OWNER"): void {
    const rank: Record<Role, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };
    const required = min === "OWNER" ? 2 : 1;
    if (rank[role] < required) {
      throw new ForbiddenException(`${min === "OWNER" ? "Owner" : "Admin"} role required.`);
    }
  }

  async updateWorkspace(
    workspaceId: string,
    input: { name?: string; slug?: string },
  ): Promise<Workspace> {
    const data: { name?: string; slug?: string } = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.slug !== undefined) {
      const clash = await this.prisma.workspace.findUnique({
        where: { slug: input.slug },
      });
      if (clash && clash.id !== workspaceId) {
        throw new BadRequestException("This slug is already taken.");
      }
      data.slug = input.slug;
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException("No workspace fields provided.");
    }
    return this.prisma.workspace.update({ where: { id: workspaceId }, data });
  }

  async setWorkspaceAvatar(
    workspaceId: string,
    avatarUrl: string,
  ): Promise<Workspace> {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { avatarUrl },
    });
  }

  async deleteWorkspace(userId: string, workspaceId: string): Promise<void> {
    const otherMemberships = await this.prisma.membership.count({
      where: { userId, workspaceId: { not: workspaceId } },
    });
    if (otherMemberships === 0) {
      throw new BadRequestException(
        "You can't delete your only workspace. Create another one first.",
      );
    }
    await this.prisma.workspace.delete({ where: { id: workspaceId } });
  }

  async leaveWorkspace(userId: string, workspaceId: string): Promise<void> {
    const membership = await this.assertMembership(userId, workspaceId);
    if (membership.role === "OWNER") {
      const otherOwners = await this.prisma.membership.count({
        where: { workspaceId, role: "OWNER", userId: { not: userId } },
      });
      if (otherOwners === 0) {
        throw new BadRequestException(
          "You're the only owner. Transfer ownership or delete the workspace instead.",
        );
      }
    }
    const otherMemberships = await this.prisma.membership.count({
      where: { userId, workspaceId: { not: workspaceId } },
    });
    if (otherMemberships === 0) {
      throw new BadRequestException(
        "You can't leave your only workspace.",
      );
    }
    await this.prisma.membership.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  async listMembers(workspaceId: string) {
    return this.prisma.membership.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    role: Role,
  ) {
    const target = await this.prisma.membership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      include: { user: true },
    });
    if (!target) throw new NotFoundException("Member not found.");

    if (target.role === "OWNER" && role !== "OWNER") {
      const otherOwners = await this.prisma.membership.count({
        where: { workspaceId, role: "OWNER", userId: { not: targetUserId } },
      });
      if (otherOwners === 0) {
        throw new BadRequestException(
          "Workspaces need at least one owner.",
        );
      }
    }

    return this.prisma.membership.update({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      data: { role },
      include: { user: true },
    });
  }

  async removeMember(workspaceId: string, targetUserId: string) {
    const target = await this.prisma.membership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException("Member not found.");
    if (target.role === "OWNER") {
      throw new ForbiddenException("Owners can't be removed. They must leave or transfer ownership.");
    }
    await this.prisma.membership.delete({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
  }

  private async uniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    // Try base, base-2, base-3, ... until free. Bounded to avoid infinite loop.
    while (suffix < 50) {
      const existing = await this.prisma.workspace.findUnique({
        where: { slug: candidate },
      });
      if (!existing) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    // Fallback: append cuid-ish noise.
    return `${base}-${Date.now().toString(36)}`;
  }
}

function slugifyEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  const cleaned = local
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "user";
}

function slugifyName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "workspace";
}

function deriveNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "User";
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ") || "User"
  );
}
