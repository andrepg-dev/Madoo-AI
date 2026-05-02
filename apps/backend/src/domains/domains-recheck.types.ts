export const DOMAIN_DNS_RECHECK_QUEUE = "domain-dns-recheck";
export const DOMAIN_DNS_RECHECK_JOB = "domain-dns-recheck";

export type DomainDnsRecheckJobPayload = {
  workspaceId: string;
  domainId: string;
};
