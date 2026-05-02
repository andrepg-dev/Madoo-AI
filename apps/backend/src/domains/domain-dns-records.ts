import type { DnsRecord } from "@madoo/shared";

export function buildDomainDnsRecords(hostname: string, dkimPublicKey: string): DnsRecord[] {
  return [
    {
      type: "TXT",
      host: "@",
      value: "v=spf1 include:_spf.madoo.app ~all",
      label: "SPF",
    },
    {
      type: "TXT",
      host: "madoo._domainkey",
      value: `v=DKIM1; k=rsa; p=${dkimPublicKey}`,
      label: "DKIM",
    },
    {
      type: "TXT",
      host: "_dmarc",
      value: `v=DMARC1; p=none; rua=mailto:dmarc@${hostname}`,
      label: "DMARC",
    },
    {
      type: "CNAME",
      host: "mail",
      value: "return.madoo.app",
      label: "Return-Path",
    },
  ];
}

export function fqdnForRecordHost(zoneHostname: string, recordHost: string): string {
  if (recordHost === "@") return zoneHostname;
  return `${recordHost}.${zoneHostname}`;
}
