import { InjectQueue } from "@nestjs/bullmq";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateDomainInputSchema } from "@madoo/shared";
import type { Domain as PrismaDomain, DnsCheck as PrismaDnsCheck } from "@prisma/client";
import { generateKeyPairSync } from "node:crypto";
import { ConfigService } from "@nestjs/config";
import type { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { encryptSecret } from "../common/crypto";
import { DOMAIN_DNS_RECHECK_JOB, DOMAIN_DNS_RECHECK_QUEUE } from "./domains-recheck.types";
import { toDomainDto, type DomainDto } from "./dto/domain.dto";
import { DnsCheckerService } from "./dns-checker.service";
import type { CreateDomainDto } from "./dto/create-domain.dto";

@Injectable()
export class DomainsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService,
    private readonly config: ConfigService,
    private readonly dnsChecker: DnsCheckerService,
    @InjectQueue(DOMAIN_DNS_RECHECK_QUEUE) private readonly recheckQueue: Queue,
  ) {}

  async create(workspaceId: string, userId: string, dto: CreateDomainDto): Promise<DomainDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const hostname = normalizeHostname(dto.hostname);
    CreateDomainInputSchema.parse({ hostname });

    const pair = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    const jwtSecret = this.config.get<string>("JWT_SECRET") ?? "";
    const encryptedPrivateKey = encryptSecret(pair.privateKey, jwtSecret);
    const dkimPublicKey = toDkimPublicKey(pair.publicKey);

    const created = await this.prisma.domain.create({
      data: {
        workspaceId,
        hostname,
        status: "PENDING",
        dkimPublicKey,
        dkimPrivateKey: encryptedPrivateKey,
      },
    });

    await this.recheckQueue.add(
      DOMAIN_DNS_RECHECK_JOB,
      { workspaceId, domainId: created.id },
      {
        jobId: `domain-recheck-${created.id}-${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: 20,
      },
    );

    return toDomainDto(created, []);
  }

  async list(workspaceId: string, userId: string): Promise<DomainDto[]> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const domains = await this.prisma.domain.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return this.withLatestChecks(domains);
  }

  async getById(workspaceId: string, userId: string, domainId: string): Promise<DomainDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const domain = await this.prisma.domain.findFirst({ where: { id: domainId, workspaceId } });
    if (!domain) throw new NotFoundException("Domain not found.");
    const [dto] = await this.withLatestChecks([domain]);
    return dto;
  }

  async remove(workspaceId: string, userId: string, domainId: string): Promise<void> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const found = await this.prisma.domain.findFirst({
      where: { id: domainId, workspaceId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException("Domain not found.");
    await this.prisma.domain.delete({ where: { id: domainId } });
  }

  async triggerRecheck(workspaceId: string, userId: string, domainId: string): Promise<{ ok: true }> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.ensureDomain(workspaceId, domainId);
    await this.recheckQueue.add(
      DOMAIN_DNS_RECHECK_JOB,
      { workspaceId, domainId },
      {
        jobId: `domain-recheck-${domainId}-${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: 20,
      },
    );
    return { ok: true };
  }

  async runRecheck(workspaceId: string, domainId: string): Promise<void> {
    const domain = await this.ensureDomain(workspaceId, domainId);
    const result = await this.dnsChecker.runChecks({
      workspaceId,
      domainId,
      hostname: domain.hostname,
      dkimPublicKey: domain.dkimPublicKey,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.dnsCheck.createMany({ data: result.checks });
      await tx.domain.update({
        where: { id: domainId },
        data: {
          status: result.verifiedCount >= 3 ? "VERIFIED" : "PENDING",
          verifiedAt: result.verifiedCount >= 3 ? new Date() : null,
        },
      });
    });
  }

  async enqueueAllPendingDomains(): Promise<void> {
    const pending = await this.prisma.domain.findMany({
      where: { status: "PENDING" },
      select: { id: true, workspaceId: true },
    });
    for (const domain of pending) {
      await this.recheckQueue.add(
        DOMAIN_DNS_RECHECK_JOB,
        { workspaceId: domain.workspaceId, domainId: domain.id },
        {
          jobId: `domain-recheck-${domain.id}-${Date.now()}`,
          removeOnComplete: true,
          removeOnFail: 20,
        },
      );
    }
  }

  private async ensureDomain(workspaceId: string, domainId: string): Promise<PrismaDomain> {
    const domain = await this.prisma.domain.findFirst({ where: { id: domainId, workspaceId } });
    if (!domain) throw new NotFoundException("Domain not found.");
    return domain;
  }

  private async withLatestChecks(domains: PrismaDomain[]): Promise<DomainDto[]> {
    if (domains.length === 0) return [];
    const checks = await this.prisma.dnsCheck.findMany({
      where: { domainId: { in: domains.map((domain) => domain.id) } },
      orderBy: { checkedAt: "desc" },
    });
    const byDomain = new Map<string, PrismaDnsCheck[]>();
    for (const check of checks) {
      const bucket = byDomain.get(check.domainId) ?? [];
      if (!bucket.some((item) => item.type === check.type)) {
        bucket.push(check);
      }
      byDomain.set(check.domainId, bucket);
    }
    return domains.map((domain) => toDomainDto(domain, byDomain.get(domain.id) ?? []));
  }
}

function normalizeHostname(hostname: string): string {
  const normalized = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!normalized || normalized.includes(" ")) {
    throw new BadRequestException("Invalid hostname.");
  }
  return normalized;
}

function toDkimPublicKey(publicPem: string): string {
  return publicPem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s+/g, "")
    .trim();
}
