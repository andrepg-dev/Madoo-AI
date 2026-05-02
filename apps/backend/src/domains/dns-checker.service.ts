import { Injectable } from "@nestjs/common";
import { resolveCname, resolveTxt } from "node:dns/promises";
import type { Prisma } from "@prisma/client";
import { buildDomainDnsRecords, fqdnForRecordHost } from "./domain-dns-records";

function normalizeTxt(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeCname(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

@Injectable()
export class DnsCheckerService {
  async runChecks(params: {
    workspaceId: string;
    domainId: string;
    hostname: string;
    dkimPublicKey: string;
  }): Promise<{
    checks: Prisma.DnsCheckCreateManyInput[];
    verifiedCount: number;
  }> {
    const records = buildDomainDnsRecords(params.hostname, params.dkimPublicKey);
    const checks: Prisma.DnsCheckCreateManyInput[] = [];
    let verifiedCount = 0;

    for (const record of records) {
      const fqdn = fqdnForRecordHost(params.hostname, record.host);
      const checkType =
        record.label === "SPF"
          ? "SPF"
          : record.label === "DKIM"
            ? "DKIM"
            : record.label === "DMARC"
              ? "DMARC"
              : "RETURN_PATH";

      try {
        let actualValue: string | undefined;
        let ok = false;

        if (record.type === "TXT") {
          const answers = await resolveTxt(fqdn);
          const flattened = answers.map((chunks) => normalizeTxt(chunks.join("")));
          const expected = normalizeTxt(record.value);
          const matched = flattened.find((candidate) => candidate === expected);
          actualValue = matched ?? flattened[0];
          ok = Boolean(matched);
        } else {
          const answers = await resolveCname(fqdn);
          const normalizedAnswers = answers.map((answer) => normalizeCname(answer));
          const expected = normalizeCname(record.value);
          const matched = normalizedAnswers.find((candidate) => candidate === expected);
          actualValue = matched ?? normalizedAnswers[0];
          ok = Boolean(matched);
        }

        if (ok) verifiedCount += 1;
        checks.push({
          workspaceId: params.workspaceId,
          domainId: params.domainId,
          type: checkType,
          hostname: fqdn,
          expected: record.value,
          actual: actualValue,
          ok,
        });
      } catch {
        checks.push({
          workspaceId: params.workspaceId,
          domainId: params.domainId,
          type: checkType,
          hostname: fqdn,
          expected: record.value,
          actual: null,
          ok: false,
        });
      }
    }

    return { checks, verifiedCount };
  }
}
