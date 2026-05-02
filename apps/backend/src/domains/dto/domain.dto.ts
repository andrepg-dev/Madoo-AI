import { DnsCheckSchema, DomainSchema, type DnsCheck, type Domain } from "@madoo/shared";
import type { DnsCheck as PrismaDnsCheck, Domain as PrismaDomain } from "@prisma/client";
import { buildDomainDnsRecords } from "../domain-dns-records";

function toSharedStatus(status: PrismaDomain["status"]): Domain["status"] {
  if (status === "VERIFIED") return "verified";
  return "pending";
}

function toSharedCheckType(type: PrismaDnsCheck["type"]): DnsCheck["type"] {
  if (type === "DKIM") return "dkim";
  if (type === "DMARC") return "dmarc";
  if (type === "RETURN_PATH") return "return_path";
  return "spf";
}

export type DomainDto = Domain;
export type DnsCheckDto = DnsCheck;

export function toDnsCheckDto(row: PrismaDnsCheck): DnsCheckDto {
  return DnsCheckSchema.parse({
    id: row.id,
    workspaceId: row.workspaceId,
    domainId: row.domainId,
    type: toSharedCheckType(row.type),
    hostname: row.hostname,
    expected: row.expected,
    actual: row.actual ?? undefined,
    ok: row.ok,
    checkedAt: row.checkedAt.toISOString(),
  });
}

export function toDomainDto(domain: PrismaDomain, latestChecks: PrismaDnsCheck[]): DomainDto {
  return DomainSchema.parse({
    id: domain.id,
    workspaceId: domain.workspaceId,
    hostname: domain.hostname,
    status: toSharedStatus(domain.status),
    dkimPublicKey: domain.dkimPublicKey,
    verifiedAt: domain.verifiedAt?.toISOString(),
    createdAt: domain.createdAt.toISOString(),
    updatedAt: domain.updatedAt.toISOString(),
    dnsRecords: buildDomainDnsRecords(domain.hostname, domain.dkimPublicKey),
    latestChecks: latestChecks.map((check) => toDnsCheckDto(check)),
  });
}
