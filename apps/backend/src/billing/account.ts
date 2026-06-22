/**
 * Account resolution for the AI-credit pool. Billing is account-wide: one
 * BillingSubscription per user, shared across every workspace that user owns.
 * A workspace's "account" is its oldest OWNER member, so a generation run in a
 * shared workspace meters against the workspace owner's pool.
 *
 * These are plain functions (no DI) so any service can resolve the owning
 * account without pulling BillingService into its module graph.
 */
import type { Plan } from "@madoo/shared";
import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

/** The account that owns a workspace's billing — its oldest OWNER member. */
export async function accountUserIdForWorkspace(
  db: Db,
  workspaceId: string,
): Promise<string | null> {
  const owner = await db.membership.findFirst({
    where: { workspaceId, role: "OWNER" },
    orderBy: { createdAt: "asc" },
    select: { userId: true },
  });
  return owner?.userId ?? null;
}

/**
 * Every workspace id owned by a user — the scope of their shared AI-credit
 * pool. Credit usage is the sum of generation runs across all of these.
 */
export async function ownedWorkspaceIds(
  db: Db,
  userId: string,
): Promise<string[]> {
  const rows = await db.membership.findMany({
    where: { userId, role: "OWNER" },
    select: { workspaceId: true },
  });
  return rows.map((r) => r.workspaceId);
}

/**
 * The plan governing a workspace = its owning account's plan. Used by the
 * per-workspace caps (stored templates, member seats) that still read a plan
 * but must honour the account-wide subscription. FREE when unattributed.
 */
export async function planForWorkspace(
  db: Db,
  workspaceId: string,
): Promise<Plan> {
  const userId = await accountUserIdForWorkspace(db, workspaceId);
  if (!userId) return "FREE";
  const sub = await db.billingSubscription.findUnique({
    where: { userId },
    select: { plan: true },
  });
  return (sub?.plan as Plan) ?? "FREE";
}
