import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Membership, Workspace } from "@prisma/client";
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

    const PLAN_RANK: Record<string, number> = { FREE: 0, STARTER: 1, GROWTH: 2 };
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
    input: { postalAddress: string },
  ): Promise<Workspace & { membership: Membership }> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    if (!membership) throw new NotFoundException("Workspace not found.");
    const updated = await this.prisma.workspace.update({
      where: { id: membership.workspaceId },
      data: { postalAddress: input.postalAddress.trim() },
    });
    return { ...updated, membership };
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
