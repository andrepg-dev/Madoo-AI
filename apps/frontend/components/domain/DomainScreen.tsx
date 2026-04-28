"use client";

import { useState } from "react";
import { Badge, Button, Card, Icon, Input, Tag } from "@madoo/ui";

const RECORDS = [
  { type: "TXT", host: "@", value: "v=spf1 include:mailmint.io ~all", label: "SPF", ok: true },
  { type: "CNAME", host: "mm._domainkey", value: "mm._domainkey.mailmint.io", label: "DKIM", ok: true },
  { type: "TXT", host: "_dmarc", value: "v=DMARC1; p=none; rua=mailto:dmarc@acme.co", label: "DMARC", ok: true },
  { type: "CNAME", host: "mail", value: "track.mailmint.io", label: "Tracking", ok: false },
];

export function DomainScreen() {
  const [domain] = useState("acme.co");
  const [verified] = useState(true);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
      <div style={{ padding: "32px 40px 60px", maxWidth: 900, margin: "0 auto" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: verified ? "var(--accent-soft)" : "var(--surface-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: verified ? "var(--accent-deep)" : "var(--ink-faint)",
              }}
            >
              {verified ? <Icon name="check" size={22} /> : <Icon name="lock" size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>{domain}</div>
              <div style={{ marginTop: 4 }}>
                <Badge tone={verified ? "success" : "warn"} dot>
                  {verified ? "3 of 4 records verified · ready to send" : "Pending verification"}
                </Badge>
              </div>
            </div>
            <Button variant="secondary" size="sm" leftIcon={<Icon name="refresh" size={12} />}>
              Re-check
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
            <Button variant="secondary" size="sm" leftIcon={<Icon name="copy" size={11} />}>
              Copy all
            </Button>
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 9, overflow: "hidden" }}>
            <div
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
            {RECORDS.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr 70px 100px",
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
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.value}
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 500 }}>
                  {r.label}
                </div>
                <div>
                  <Badge tone={r.ok ? "success" : "warn"} dot>
                    {r.ok ? "Verified" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padded style={{ marginTop: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Sender identity</div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-faint)",
              marginTop: 2,
              marginBottom: 14,
            }}
          >
            How recipients see you in their inbox.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="From name" defaultValue="Acme Brand" variant="filled" inputSize="md" />
            <Input
              label="From email"
              defaultValue="hello@acme.co"
              variant="filled"
              inputSize="md"
              type="email"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
