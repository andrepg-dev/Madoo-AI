"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";

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

        <div
          style={{
            marginTop: 24,
            padding: 22,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
        >
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12.5,
                  color: verified ? "var(--accent-deep)" : "var(--ink-soft)",
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: verified ? "var(--accent)" : "#D69E2E",
                  }}
                />
                {verified ? "3 of 4 records verified · ready to send" : "Pending verification"}
              </div>
            </div>
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: 12.5,
                color: "var(--ink)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Icon name="refresh" size={12} /> Re-check
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 22,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
        >
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
            <button
              type="button"
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: 12,
                color: "var(--ink-soft)",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="copy" size={11} /> Copy all
            </button>
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
                  <span
                    className="mono"
                    style={{
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: "var(--surface-2)",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    {r.type}
                  </span>
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
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      background: r.ok ? "#E5EFE6" : "#FFF1D6",
                      color: r.ok ? "#2F5C42" : "#7A5A1E",
                    }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: r.ok ? "#2F5C42" : "#D69E2E",
                      }}
                    />
                    {r.ok ? "Verified" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 22,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
        >
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
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ink-faint)",
                  marginBottom: 6,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                From name
              </div>
              <input
                defaultValue="Acme Brand"
                style={{
                  width: "100%",
                  height: 36,
                  padding: "0 12px",
                  borderRadius: 7,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  fontSize: 13,
                  color: "var(--ink)",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ink-faint)",
                  marginBottom: 6,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                From email
              </div>
              <input
                defaultValue="hello@acme.co"
                style={{
                  width: "100%",
                  height: 36,
                  padding: "0 12px",
                  borderRadius: 7,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  fontSize: 13,
                  color: "var(--ink)",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
