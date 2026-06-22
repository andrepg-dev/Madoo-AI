import { randomBytes } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  MyReferralSchema,
  REFERRAL_QUERY_PARAM,
  REFERRAL_REWARD_CREDITS,
  type MyReferralDto,
} from "@madoo/shared";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/** url-safe alphabet for share codes (no look-alike 0/O/1/l/I). */
const CODE_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 8;

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Returns the user's referral link + lifetime stats, lazily minting a unique
   * `referralCode` the first time it is requested.
   */
  async getMyReferral(userId: string): Promise<MyReferralDto> {
    const code = await this.ensureReferralCode(userId);

    const [invitedCount, rewards] = await Promise.all([
      this.prisma.user.count({ where: { referredByUserId: userId } }),
      this.prisma.referralReward.findMany({
        where: { referrerUserId: userId },
        select: { credits: true },
      }),
    ]);

    const creditsEarned = rewards.reduce((sum, r) => sum + r.credits, 0);

    return MyReferralSchema.parse({
      code,
      url: this.shareUrl(code),
      invitedCount,
      qualifiedCount: rewards.length,
      creditsEarned,
      rewardPerReferral: REFERRAL_REWARD_CREDITS,
    });
  }

  /**
   * Called when a user becomes a real paying customer. If they were referred
   * and no reward exists yet for them, grants the referrer a one-time
   * bonus-credit reward on their account subscription. Idempotent: the unique
   * `ReferralReward.referredUserId` absorbs Stripe re-delivery and resubscribes.
   */
  async rewardIfQualified(paidUserId: string): Promise<void> {
    const owner = await this.prisma.user.findUnique({
      where: { id: paidUserId },
      select: { id: true, referredByUserId: true },
    });
    if (!owner?.referredByUserId) return;

    // Fast path: skip the write entirely if already rewarded for this invitee.
    const existing = await this.prisma.referralReward.findUnique({
      where: { referredUserId: owner.id },
      select: { id: true },
    });
    if (existing) return;

    // Audit trail only: the referrer's oldest owned workspace. Credits now land
    // on the referrer's account subscription, not a workspace.
    const rewardWorkspaceId = await this.firstOwnedWorkspaceId(
      owner.referredByUserId,
    );
    if (!rewardWorkspaceId) return;

    try {
      await this.prisma.$transaction([
        this.prisma.referralReward.create({
          data: {
            referrerUserId: owner.referredByUserId,
            referredUserId: owner.id,
            workspaceId: rewardWorkspaceId,
            credits: REFERRAL_REWARD_CREDITS,
          },
        }),
        this.prisma.billingSubscription.upsert({
          where: { userId: owner.referredByUserId },
          create: {
            userId: owner.referredByUserId,
            plan: "FREE",
            status: "ACTIVE",
            bonusCredits: REFERRAL_REWARD_CREDITS,
          },
          update: { bonusCredits: { increment: REFERRAL_REWARD_CREDITS } },
        }),
      ]);
      this.logger.log(
        `referral reward: +${REFERRAL_REWARD_CREDITS} credits to user ${owner.referredByUserId} for paid referral ${owner.id}`,
      );
    } catch (err) {
      // Unique violation = concurrent webhook already rewarded; safe to ignore.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return;
      }
      throw err;
    }
  }

  /** The referrer's oldest owned workspace — where their bonus credits land. */
  private async firstOwnedWorkspaceId(userId: string): Promise<string | null> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, role: "OWNER" },
      orderBy: { createdAt: "asc" },
      select: { workspaceId: true },
    });
    return membership?.workspaceId ?? null;
  }

  private async ensureReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (user?.referralCode) return user.referralCode;

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      try {
        const updated = await this.prisma.user.update({
          where: { id: userId },
          data: { referralCode: code },
          select: { referralCode: true },
        });
        return updated.referralCode!;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          // Code collision (extremely rare) — retry with a fresh one.
          continue;
        }
        throw err;
      }
    }
    throw new Error("Could not allocate a unique referral code.");
  }

  private shareUrl(code: string): string {
    // Always the public landing site — never APP_URL (the gated client app),
    // which would bounce a logged-out invitee through the login redirect and
    // bury the ?ref code in a ?next param.
    const base = (
      this.config.get<string>("LANDING_URL") ?? "https://madooai.com"
    ).replace(/\/$/, "");
    return `${base}/?${REFERRAL_QUERY_PARAM}=${encodeURIComponent(code)}`;
  }
}

function generateCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return out;
}
