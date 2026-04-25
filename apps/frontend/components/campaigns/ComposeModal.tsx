"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { TemplatePreview } from "@/components/templates/TemplatePreview";
import {
  CSV_FIELDS,
  DRAFT_EMAILS,
  EMAIL_VARIABLES,
  PREVIEW_CONTACTS,
  SEGMENTS,
  TEMPLATES,
} from "@/lib/data";

type VarMap = Record<string, { field: string | null; fallback: string }>;

const initialVarMap = (): VarMap =>
  Object.fromEntries(
    EMAIL_VARIABLES.map((v) => [
      v.token,
      {
        field: v.auto,
        fallback:
          v.token === "{Nombre}"
            ? "friend"
            : v.token === "{Empresa}"
              ? "your team"
              : v.token === "{Ciudad}"
                ? "there"
                : "recently",
      },
    ]),
  );

export function ComposeModal({ onClose, onSend }: { onClose: () => void; onSend: () => void }) {
  const [step, setStep] = useState(1);
  const [emailId, setEmailId] = useState("d1");
  const [audience, setAudience] = useState("All contacts");
  const [schedule, setSchedule] = useState<"now" | "later">("now");
  const [abTest, setAbTest] = useState(true);
  const [varMap, setVarMap] = useState<VarMap>(initialVarMap);
  const [previewIdx, setPreviewIdx] = useState(0);

  const audCount = SEGMENTS.find((s) => s.name === audience)?.count || 0;
  const chosenEmail = DRAFT_EMAILS.find((e) => e.id === emailId) || DRAFT_EMAILS[0];
  const chosenTpl = TEMPLATES[chosenEmail.tplIdx];
  const totalMissing =
    EMAIL_VARIABLES.filter((v) => !varMap[v.token]?.field).reduce((acc) => acc + audCount, 0) +
    EMAIL_VARIABLES.filter((v) => varMap[v.token]?.field).reduce((acc, v) => acc + v.missing, 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,15,10,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 640,
          background: "var(--surface)",
          borderRadius: 16,
          boxShadow: "0 30px 80px -20px rgba(20,15,10,0.4)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--ink-faint)" }}>
              STEP {step} OF 5
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
              {step === 1
                ? "Choose an email"
                : step === 2
                  ? "Choose your audience"
                  : step === 3
                    ? "Map your variables"
                    : step === 4
                      ? "When should it go out?"
                      : "Review and send"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "var(--surface-2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-soft)",
            }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div style={{ display: "flex", height: 3, background: "var(--surface-2)" }}>
          <div
            style={{
              width: `${(step / 5) * 100}%`,
              background: "var(--accent)",
              transition: "width 0.3s",
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 14,
                  borderRadius: 10,
                  border: "1px dashed var(--border)",
                  background: "var(--accent-soft)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  color: "var(--accent-deep)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--accent)",
                    color: "var(--accent-fg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="sparkle" size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Generate a new email with AI</div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                    Describe it and we&apos;ll write it on the spot.
                  </div>
                </div>
                <Icon name="arrow" size={14} />
              </button>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 1,
                  color: "var(--ink-faint)",
                  marginTop: 6,
                }}
              >
                YOUR DRAFTS
              </div>
              {DRAFT_EMAILS.map((e) => {
                const tpl = TEMPLATES[e.tplIdx];
                const selected = emailId === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEmailId(e.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 10,
                      borderRadius: 10,
                      border: selected ? "1.5px solid var(--ink)" : "1px solid var(--border)",
                      background: selected ? "var(--surface-2)" : "var(--surface)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 70,
                        borderRadius: 6,
                        overflow: "hidden",
                        flexShrink: 0,
                        border: "1px solid var(--border-soft)",
                      }}
                    >
                      <TemplatePreview template={tpl} scale={0.55} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{e.name}</div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--ink-soft)",
                          marginTop: 2,
                          fontStyle: "italic",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        &quot;{e.subject}&quot;
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 4 }}>
                        Edited {e.updated}
                      </div>
                    </div>
                    {selected && (
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "var(--ink)",
                          color: "var(--bg)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon name="check" size={11} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SEGMENTS.map((s) => {
                const selected = audience === s.name;
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setAudience(s.name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 14,
                      borderRadius: 10,
                      border: selected ? "1.5px solid var(--ink)" : "1px solid var(--border)",
                      background: selected ? "var(--surface-2)" : "var(--surface)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: s.accent,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>
                        {s.count.toLocaleString()} contacts
                      </div>
                    </div>
                    {selected && (
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "var(--ink)",
                          color: "var(--bg)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon name="check" size={11} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  padding: 12,
                  background: totalMissing > 0 ? "var(--accent-soft)" : "#E5EFE6",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "var(--accent)",
                    color: "var(--accent-fg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="sparkle" size={13} />
                </div>
                <div
                  style={{
                    flex: 1,
                    fontSize: 12.5,
                    color: "var(--accent-deep)",
                    lineHeight: 1.5,
                  }}
                >
                  <b>
                    {audCount.toLocaleString()} of {audCount.toLocaleString()}
                  </b>{" "}
                  contacts will receive the email. Variables are auto-matched — review below.
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "110px 18px 1fr",
                      gap: 8,
                      padding: "0 4px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--ink-faint)",
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    <div>Email variable</div>
                    <div></div>
                    <div>Contact field</div>
                  </div>
                  {EMAIL_VARIABLES.map((v) => {
                    const m = varMap[v.token];
                    const isMatched = !!m?.field;
                    return (
                      <div
                        key={v.token}
                        style={{
                          padding: 10,
                          background: "var(--surface-2)",
                          borderRadius: 9,
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "110px 18px 1fr",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <div
                            className="mono"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "5px 9px",
                              background: "var(--accent-soft)",
                              color: "var(--accent-deep)",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              alignSelf: "flex-start",
                              width: "fit-content",
                            }}
                          >
                            {v.token}
                          </div>
                          <div
                            style={{
                              color: "var(--ink-faint)",
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <Icon name="arrow" size={12} />
                          </div>
                          <select
                            className="mono"
                            value={m?.field || ""}
                            onChange={(e) =>
                              setVarMap((prev) => ({
                                ...prev,
                                [v.token]: {
                                  ...prev[v.token],
                                  field: e.target.value || null,
                                },
                              }))
                            }
                            style={{
                              width: "100%",
                              height: 30,
                              padding: "0 8px",
                              borderRadius: 6,
                              border: isMatched ? "1px solid var(--border)" : "1.5px solid #D69E2E",
                              background: "var(--surface)",
                              fontSize: 12.5,
                              color: isMatched ? "var(--ink)" : "var(--ink-soft)",
                              cursor: "pointer",
                            }}
                          >
                            <option value="">— select field —</option>
                            {CSV_FIELDS.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: "1px solid var(--border)",
                          }}
                        >
                          <span style={{ fontSize: 11, color: "var(--ink-faint)", fontWeight: 500 }}>
                            If empty, use:
                          </span>
                          <input
                            value={m?.fallback || ""}
                            onChange={(e) =>
                              setVarMap((prev) => ({
                                ...prev,
                                [v.token]: { ...prev[v.token], fallback: e.target.value },
                              }))
                            }
                            placeholder="friend"
                            style={{
                              flex: 1,
                              height: 24,
                              padding: "0 8px",
                              borderRadius: 5,
                              border: "1px solid var(--border)",
                              background: "var(--surface)",
                              fontSize: 11.5,
                              color: "var(--ink)",
                              fontFamily: "inherit",
                              outline: "none",
                            }}
                          />
                          {isMatched && v.missing > 0 && (
                            <span
                              style={{
                                fontSize: 10.5,
                                color: "#7A5A1E",
                                background: "#FFF1D6",
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {v.missing} missing
                            </span>
                          )}
                          {!isMatched && (
                            <span
                              style={{
                                fontSize: 10.5,
                                color: "#A23E2F",
                                background: "#FBE8E2",
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                              }}
                            >
                              not mapped
                            </span>
                          )}
                        </div>
                        {!isMatched && v.suggestions && (
                          <div
                            style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}
                          >
                            <span
                              style={{
                                fontSize: 10.5,
                                color: "var(--ink-faint)",
                                alignSelf: "center",
                              }}
                            >
                              Try:
                            </span>
                            {v.suggestions.map((s) => (
                              <button
                                key={s}
                                type="button"
                                className="mono"
                                onClick={() =>
                                  setVarMap((prev) => ({
                                    ...prev,
                                    [v.token]: { ...prev[v.token], field: s },
                                  }))
                                }
                                style={{
                                  padding: "2px 7px",
                                  borderRadius: 4,
                                  border: "1px solid var(--border)",
                                  background: "var(--surface)",
                                  fontSize: 10.5,
                                  color: "var(--accent-deep)",
                                  cursor: "pointer",
                                }}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    background: "var(--surface-2)",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    padding: 12,
                    height: "fit-content",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--ink-faint)",
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Preview as
                  </div>
                  <select
                    value={previewIdx}
                    onChange={(e) => setPreviewIdx(Number(e.target.value))}
                    style={{
                      width: "100%",
                      height: 30,
                      padding: "0 8px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      fontSize: 12.5,
                      color: "var(--ink)",
                      fontFamily: "inherit",
                      cursor: "pointer",
                      marginBottom: 10,
                    }}
                  >
                    {PREVIEW_CONTACTS.map((c, i) => (
                      <option key={i} value={i}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div
                    style={{
                      background: "var(--surface)",
                      borderRadius: 7,
                      padding: 12,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: "var(--ink)",
                    }}
                  >
                    {(() => {
                      const c = PREVIEW_CONTACTS[previewIdx];
                      const resolve = (tok: string) => {
                        const m = varMap[tok];
                        if (!m?.field) return m?.fallback || tok;
                        const v = (c.data as Record<string, string>)[tok];
                        return v && v !== "—" ? v : m.fallback || tok;
                      };
                      return (
                        <>
                          <div style={{ fontWeight: 600 }}>Hi {resolve("{Nombre}")},</div>
                          <div style={{ marginTop: 6, color: "var(--ink-soft)" }}>
                            We noticed {resolve("{Empresa}")} has been growing fast. Folks in {resolve("{Ciudad}")} love
                            what we shipped since your last order ({resolve("{Última_compra}")}).
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "var(--ink-faint)",
                      marginTop: 8,
                      lineHeight: 1.4,
                      fontStyle: "italic",
                    }}
                  >
                    Switch contacts to see how the email renders for different recipients.
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSchedule("now")}
                  style={{
                    padding: 18,
                    borderRadius: 10,
                    border: schedule === "now" ? "1.5px solid var(--ink)" : "1px solid var(--border)",
                    background: schedule === "now" ? "var(--surface-2)" : "var(--surface)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Send now</div>
                  <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 4 }}>
                    Goes out immediately to {audCount.toLocaleString()} contacts
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSchedule("later")}
                  style={{
                    padding: 18,
                    borderRadius: 10,
                    border: schedule === "later" ? "1.5px solid var(--ink)" : "1px solid var(--border)",
                    background: schedule === "later" ? "var(--surface-2)" : "var(--surface)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Schedule for later</div>
                  <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 4 }}>
                    Pick a date and time
                  </div>
                </button>
              </div>
              {schedule === "later" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    padding: 14,
                    background: "var(--surface-2)",
                    borderRadius: 10,
                  }}
                >
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
                      Date
                    </div>
                    <input
                      type="date"
                      defaultValue="2026-04-30"
                      style={{
                        width: "100%",
                        height: 34,
                        padding: "0 10px",
                        borderRadius: 7,
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        fontSize: 13,
                        color: "var(--ink)",
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
                      Time
                    </div>
                    <input
                      type="time"
                      defaultValue="09:00"
                      style={{
                        width: "100%",
                        height: 34,
                        padding: "0 10px",
                        borderRadius: 7,
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        fontSize: 13,
                        color: "var(--ink)",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>
              )}
              <div
                style={{
                  padding: 14,
                  background: "var(--accent-soft)",
                  borderRadius: 10,
                  display: "flex",
                  gap: 10,
                }}
              >
                <input
                  type="checkbox"
                  checked={abTest}
                  onChange={(e) => setAbTest(e.target.checked)}
                  style={{ accentColor: "var(--accent-deep)", marginTop: 2, cursor: "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-deep)" }}>
                    Run A/B test on subject lines
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--accent-deep)",
                      opacity: 0.8,
                      marginTop: 2,
                      lineHeight: 1.45,
                    }}
                  >
                    Send 3 variants to 10% of your list, then auto-send the winner to the rest after 4 hours.
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 12,
                  background: "var(--surface-2)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 76,
                    borderRadius: 6,
                    overflow: "hidden",
                    flexShrink: 0,
                    border: "1px solid var(--border-soft)",
                  }}
                >
                  <TemplatePreview template={chosenTpl} scale={0.6} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Sending
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginTop: 2 }}>
                    {chosenEmail.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-soft)",
                      marginTop: 4,
                      fontStyle: "italic",
                    }}
                  >
                    &quot;{chosenEmail.subject}&quot;
                  </div>
                </div>
              </div>

              {(
                [
                  ["Email", chosenEmail.name],
                  ["Subject", chosenEmail.subject],
                  ["Audience", `${audience} (${audCount.toLocaleString()} contacts)`],
                  ["Schedule", schedule === "now" ? "Sending immediately" : "Apr 30, 2026 · 9:00 AM"],
                  ["A/B test", abTest ? "Yes — 3 subject variants" : "No"],
                  ["From", "Acme Brand <hello@acme.co>"],
                ] as const
              ).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border-soft)",
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--ink-faint)", fontWeight: 500 }}>{k}</div>
                  <div style={{ fontSize: 13.5, color: "var(--ink)" }}>{v}</div>
                </div>
              ))}

              <div
                style={{
                  marginTop: 8,
                  padding: 14,
                  background: "var(--accent-soft)",
                  borderRadius: 10,
                  fontSize: 12.5,
                  color: "var(--accent-deep)",
                  lineHeight: 1.5,
                }}
              >
                <b>✱ AI prediction:</b> Based on your past campaigns, expect{" "}
                <b>~{Math.round(audCount * 0.58).toLocaleString()} opens</b> and{" "}
                <b>~{Math.round(audCount * 0.14).toLocaleString()} clicks</b>.
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => (step === 1 ? onClose() : setStep((s) => s - 1))}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              fontSize: 13,
              color: "var(--ink)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <button
            type="button"
            onClick={() => (step === 5 ? onSend() : setStep((s) => s + 1))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "var(--ink)",
              color: "var(--bg)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {step === 5 ? (
              <>
                <Icon name="send" size={12} /> Send campaign
              </>
            ) : (
              <>
                Continue <Icon name="arrow" size={12} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
