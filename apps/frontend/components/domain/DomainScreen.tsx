"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, Icon, Input, Tag } from "@madoo/ui";
import { domainsApi, domainsKeys } from "@/actions/domains";
import { ApiError } from "@/lib/api/fetch-wrapper";

export function DomainScreen() {
  const queryClient = useQueryClient();
  const [hostname, setHostname] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const domainsQuery = useQuery({
    queryKey: domainsKeys.list(),
    queryFn: () => domainsApi.list(),
  });

  useEffect(() => {
    if (!selectedDomainId && domainsQuery.data && domainsQuery.data.length > 0) {
      setSelectedDomainId(domainsQuery.data[0].id);
    }
  }, [domainsQuery.data, selectedDomainId]);

  const selectedDomain = useMemo(
    () => domainsQuery.data?.find((domain) => domain.id === selectedDomainId) ?? domainsQuery.data?.[0],
    [domainsQuery.data, selectedDomainId],
  );

  const createDomainMutation = useMutation({
    mutationFn: () => domainsApi.create({ hostname }),
    onSuccess: () => {
      setHostname("");
      setFeedback("Domain created. Add DNS records and run re-check.");
      queryClient.invalidateQueries({ queryKey: domainsKeys.list() });
    },
    onError: (error) => {
      setFeedback(toErrorMessage(error));
    },
  });

  const recheckMutation = useMutation({
    mutationFn: (domainId: string) => domainsApi.recheck(domainId),
    onSuccess: () => {
      setFeedback("Re-check queued.");
      queryClient.invalidateQueries({ queryKey: domainsKeys.list() });
    },
    onError: (error) => {
      setFeedback(toErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (domainId: string) => domainsApi.remove(domainId),
    onSuccess: () => {
      setFeedback("Domain removed.");
      setSelectedDomainId(null);
      queryClient.invalidateQueries({ queryKey: domainsKeys.list() });
    },
    onError: (error) => {
      setFeedback(toErrorMessage(error));
    },
  });

  const records = selectedDomain?.dnsRecords ?? [];
  const verifiedCount = (selectedDomain?.latestChecks ?? []).filter((check) => check.ok).length;
  const isVerified = selectedDomain?.status === "verified";

  async function copyText(value: string, successMessage: string, key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(successMessage);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1200);
    } catch {
      setFeedback("Could not copy to clipboard. Check browser permissions.");
    }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
      <div className="madoo-screen-pad" style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1
          className="serif"
          style={{ fontSize: 36, fontWeight: 400, margin: 0, letterSpacing: -0.5 }}
        >
          Sending domain
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 6 }}>
          Verify your domain so emails come from you, not us. Better deliverability, fewer spam folders.
        </p>

        <Card padded style={{ marginTop: 24, padding: 22 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <Input
              label="Domain hostname"
              placeholder="acme.co"
              value={hostname}
              onChange={(event) => setHostname(event.target.value)}
              variant="filled"
              inputSize="md"
              style={{ flex: 1 }}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => createDomainMutation.mutate()}
              disabled={!hostname.trim() || createDomainMutation.isPending}
            >
              {createDomainMutation.isPending ? "Creating..." : "Add domain"}
            </Button>
          </div>
          {feedback && (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-soft)" }}>
              {feedback}
            </div>
          )}
        </Card>

        {(domainsQuery.data?.length ?? 0) > 1 && (
          <Card padded style={{ marginTop: 16, padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 8 }}>Your domains</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(domainsQuery.data ?? []).map((domain) => (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() => setSelectedDomainId(domain.id)}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    background: selectedDomainId === domain.id ? "var(--accent-soft)" : "var(--surface)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {domain.hostname}
                </button>
              ))}
            </div>
          </Card>
        )}

        {!selectedDomain && (
          <Card padded style={{ marginTop: 16, padding: 22 }}>
            <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>
              No domain yet. Add one to generate DNS records.
            </div>
          </Card>
        )}

        {selectedDomain && (
          <>
        <Card padded style={{ marginTop: 24, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: isVerified ? "var(--accent-soft)" : "var(--surface-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isVerified ? "var(--accent-deep)" : "var(--ink-faint)",
              }}
            >
              {isVerified ? <Icon name="check" size={22} /> : <Icon name="lock" size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>{selectedDomain.hostname}</div>
              <div style={{ marginTop: 4 }}>
                <Badge tone={isVerified ? "success" : "warn"} dot>
                  {isVerified
                    ? `${verifiedCount} of 4 records verified · ready to send`
                    : `${verifiedCount} of 4 records verified · pending`}
                </Badge>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Icon name="refresh" size={12} />}
              onClick={() => recheckMutation.mutate(selectedDomain.id)}
              disabled={recheckMutation.isPending}
            >
              {recheckMutation.isPending ? "Queueing..." : "Re-check"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteMutation.mutate(selectedDomain.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </Card>

        <Card padded style={{ marginTop: 16, padding: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>DNS records</div>
              <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>
                Add these to your domain provider (Cloudflare, Namecheap, GoDaddy…)
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Icon name="copy" size={11} />}
              onClick={() => {
                const payload = records
                  .map((record) => `${record.type}\t${record.host}\t${record.value}\t# ${record.label}`)
                  .join("\n");
                void copyText(payload, "DNS records copied to clipboard.", "all");
              }}
            >
              {copiedKey === "all" ? "Copied" : "Copy all"}
            </Button>
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 9, overflow: "hidden" }}>
            <div
              className="madoo-dns-row madoo-desktop-only"
              style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr 70px 100px",
                gap: 12,
                padding: "10px 14px",
                background: "var(--surface-2)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--ink-faint)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              <div>Type</div>
              <div>Host / Value</div>
              <div>Purpose</div>
              <div>Status</div>
            </div>
            {records.map((r, i) => {
              const check = selectedDomain.latestChecks.find(
                (item) =>
                  item.hostname === toRecordHostname(selectedDomain.hostname, r.host) &&
                  item.expected === r.value,
              );
              const ok = check?.ok ?? false;
              return (
                <div
                  key={i}
                  className="madoo-dns-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px minmax(0, 1fr) 70px 100px",
                    gap: 12,
                    padding: 14,
                    borderTop: "1px solid var(--border-soft)",
                    alignItems: "center",
                    fontSize: 12.5,
                  }}
                >
                  <div>
                    <Tag tone="neutral" size="sm">
                      {r.type}
                    </Tag>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 12, color: "var(--ink)" }}>
                      {r.host}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: "var(--ink-soft)",
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "normal",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {r.value}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => void copyText(r.host, `Copied host: ${r.host}`, `host-${i}`)}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          background: "var(--surface)",
                          cursor: "pointer",
                          fontSize: 11,
                          padding: "4px 8px",
                        }}
                      >
                        {copiedKey === `host-${i}` ? "Copied" : "Copy host"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyText(r.value, `Copied value for ${r.label}`, `value-${i}`)}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          background: "var(--surface)",
                          cursor: "pointer",
                          fontSize: 11,
                          padding: "4px 8px",
                        }}
                      >
                        {copiedKey === `value-${i}` ? "Copied" : "Copy value"}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 500 }}>
                    {r.label}
                  </div>
                  <div>
                    <Badge tone={ok ? "success" : "warn"} dot>
                      {ok ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
          </>
        )}
      </div>
    </div>
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Unexpected error.";
}

function toRecordHostname(zone: string, host: string): string {
  if (host === "@") return zone;
  return `${host}.${zone}`;
}
