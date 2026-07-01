import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AdminEmailDetailSchema,
  AdminEmailListSchema,
  type AdminEmailDetail,
  type AdminEmailList,
  type AdminEmailStatus,
} from "@madoo/shared";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const DAY_MS = 86_400_000;
const VOLUME_DAYS = 14;
const EMAIL_STATUSES: AdminEmailStatus[] = [
  "DRAFT",
  "GENERATING",
  "READY",
  "ERROR",
];

@Injectable()
export class AdminEmailsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    page: number;
    pageSize: number;
    search?: string;
  }): Promise<AdminEmailList> {
    const page = Math.max(1, Math.floor(params.page) || 1);
    // The UI shows one scrollable list (no pagination), so allow a large page.
    const pageSize = Math.min(1000, Math.max(1, Math.floor(params.pageSize) || 500));
    const search = params.search?.trim();
    const now = new Date();

    const where: Prisma.EmailWhereInput = search
      ? {
          OR: [
            { prompt: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
            { createdBy: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {};

    const seriesStart = startOfUtcDay(new Date(Date.now() - (VOLUME_DAYS - 1) * DAY_MS));

    const [
      total,
      rows,
      statusRows,
      volumeRows,
      heatRows,
      userCount,
      subs,
      exportRows,
    ] = await Promise.all([
        this.prisma.email.count({ where }),
        this.prisma.email.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            createdBy: { select: { email: true, name: true } },
            workspace: { select: { name: true } },
            _count: { select: { variants: true, chatMessages: true } },
            variants: {
              orderBy: { seq: "desc" },
              take: 1,
              select: { subject: true, previewUrl: true },
            },
          },
        }),
        this.prisma.email.groupBy({ by: ["status"], _count: { _all: true } }),
        this.prisma.$queryRaw<{ date: string; count: number }[]>`
          SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date,
                 count(*)::int AS count
          FROM "Email"
          WHERE "createdAt" >= ${seriesStart}
          GROUP BY 1
          ORDER BY 1
        `,
        this.prisma.$queryRaw<
          { weekday: number; hour: number; count: number }[]
        >`
          SELECT EXTRACT(DOW FROM "createdAt")::int AS weekday,
                 EXTRACT(HOUR FROM "createdAt")::int AS hour,
                 count(*)::int AS count
          FROM "Email"
          GROUP BY 1, 2
        `,
        this.prisma.user.count(),
        this.prisma.billingSubscription.findMany({
          select: { plan: true, status: true, trialEndsAt: true },
        }),
        this.prisma.$queryRaw<{ total: number; emails: number }[]>`
          SELECT count(*)::int AS total,
                 count(DISTINCT properties->>'emailId')::int AS emails
          FROM "ProductEvent"
          WHERE name = 'email.exported'
        `,
      ]);

    const heatmap = heatRows.map((row) => ({
      weekday: Number(row.weekday),
      hour: Number(row.hour),
      count: Number(row.count),
    }));

    const trial = subs.filter(
      (sub) =>
        sub.status === "TRIALING" ||
        (sub.trialEndsAt !== null && sub.trialEndsAt > now),
    ).length;
    const paid = subs.filter(
      (sub) =>
        sub.status === "ACTIVE" &&
        sub.plan !== "FREE" &&
        !(sub.trialEndsAt !== null && sub.trialEndsAt > now),
    ).length;
    const plans = {
      paid,
      trial,
      free: Math.max(0, userCount - paid - trial),
    };

    const exportRow = exportRows[0];
    const exports = {
      totalExports: Number(exportRow?.total ?? 0),
      emailsExported: Number(exportRow?.emails ?? 0),
    };

    const statusMap = new Map<string, number>(
      statusRows.map((row) => [row.status, row._count._all]),
    );
    const statusBreakdown = EMAIL_STATUSES.map((status) => ({
      status,
      count: statusMap.get(status) ?? 0,
    }));

    const volumeMap = new Map<string, number>(
      volumeRows.map((row) => [row.date, Number(row.count)]),
    );
    const dailyVolume = lastNDays(VOLUME_DAYS).map((date) => ({
      date,
      count: volumeMap.get(date) ?? 0,
    }));

    return AdminEmailListSchema.parse({
      total,
      page,
      pageSize,
      statusBreakdown,
      dailyVolume,
      heatmap,
      plans,
      exports,
      items: rows.map((email) => ({
        id: email.id,
        title: email.title,
        prompt: email.prompt,
        status: email.status,
        tone: email.tone,
        length: email.length,
        audience: email.audience,
        createdAt: email.createdAt.toISOString(),
        updatedAt: email.updatedAt.toISOString(),
        userEmail: email.createdBy?.email ?? null,
        userName: email.createdBy?.name ?? null,
        workspaceName: email.workspace?.name ?? null,
        variantCount: email._count.variants,
        chatMessageCount: email._count.chatMessages,
        latestSubject: email.variants[0]?.subject ?? null,
        previewUrl: email.variants[0]?.previewUrl ?? null,
      })),
    });
  }

  async detail(id: string): Promise<AdminEmailDetail> {
    const email = await this.prisma.email.findUnique({
      where: { id },
      include: {
        createdBy: { select: { email: true, name: true } },
        workspace: { select: { name: true } },
        variants: { orderBy: { seq: "asc" } },
        chatMessages: { orderBy: { createdAt: "asc" } },
        generationRuns: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!email) {
      throw new NotFoundException("Email not found.");
    }

    return AdminEmailDetailSchema.parse({
      id: email.id,
      title: email.title,
      prompt: email.prompt,
      tone: email.tone,
      length: email.length,
      audience: email.audience,
      status: email.status,
      visibility: email.visibility,
      createdAt: email.createdAt.toISOString(),
      updatedAt: email.updatedAt.toISOString(),
      userEmail: email.createdBy?.email ?? null,
      userName: email.createdBy?.name ?? null,
      workspaceName: email.workspace?.name ?? null,
      variants: email.variants.map((variant) => ({
        id: variant.id,
        seq: variant.seq,
        subject: variant.subject,
        compiledHtml: variant.compiledHtml,
        previewUrl: variant.previewUrl,
        createdAt: variant.createdAt.toISOString(),
      })),
      chatMessages: email.chatMessages.map((message) => ({
        id: message.id,
        role: message.role,
        kind: message.kind,
        content: message.content,
        imageUrls: message.imageUrls,
        feedback: message.feedback,
        feedbackComment: message.feedbackComment,
        createdAt: message.createdAt.toISOString(),
      })),
      runs: email.generationRuns.map((run) => ({
        id: run.id,
        kind: run.kind,
        status: run.status,
        inputTokens: run.inputTokens,
        outputTokens: run.outputTokens,
        cachedTokens: run.cachedTokens,
        latencyMs: run.latencyMs,
        errorMessage: run.errorMessage,
        createdAt: run.createdAt.toISOString(),
        completedAt: run.completedAt?.toISOString() ?? null,
      })),
    });
  }
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function lastNDays(n: number): string[] {
  const today = startOfUtcDay(new Date());
  return Array.from({ length: n }, (_, index) => {
    const day = new Date(today.getTime() - (n - 1 - index) * DAY_MS);
    return day.toISOString().slice(0, 10);
  });
}
