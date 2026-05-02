"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banner,
  Button,
  Checkbox,
  Icon,
  Input,
  Modal,
  ProgressBar,
  SelectableCard,
  Select,
  Tag,
} from "@madoo/ui";
import { TemplatePreview } from "@/components/templates/TemplatePreview";
import { useEmails } from "@/hooks/use-emails";
import {
  CSV_FIELDS,
  DRAFT_EMAILS,
  PREVIEW_CONTACTS,
  SEGMENTS,
  TEMPLATES,
} from "@/lib/data";

type VarMap = Record<string, { field: string | null }>;
const EMPTY_VARIABLES: Array<{ name: string; default: string; label?: string }> = [];

const initialVarMap = (variableNames: string[]): VarMap =>
  Object.fromEntries(
    variableNames.map((name) => [
      name,
      {
        field: null,
      },
    ]),
  );

const STEP_TITLES = [
  "Choose an email",
  "Choose your audience",
  "Map your variables",
  "When should it go out?",
  "Review and send",
];

export function ComposeModal({ onClose, onSend }: { onClose: () => void; onSend: () => void }) {
  const [step, setStep] = useState(1);
  const [emailId, setEmailId] = useState("d1");
  const [audience, setAudience] = useState("All contacts");
  const [schedule, setSchedule] = useState<"now" | "later">("now");
  const [abTest, setAbTest] = useState(true);
  const [varMap, setVarMap] = useState<VarMap>({});
  const [previewIdx, setPreviewIdx] = useState(0);
  const emailsQuery = useEmails();

  const audCount = SEGMENTS.find((s) => s.name === audience)?.count || 0;
  const chosenEmail = DRAFT_EMAILS.find((e) => e.id === emailId) || DRAFT_EMAILS[0];
  const chosenTpl = TEMPLATES[chosenEmail.tplIdx];
  const draftIndex = Math.max(
    0,
    DRAFT_EMAILS.findIndex((draft) => draft.id === chosenEmail.id),
  );
  const selectedEmail = emailsQuery.data?.[draftIndex] ?? emailsQuery.data?.[0];
  const currentVariant =
    selectedEmail && selectedEmail.variants.length > 0
      ? selectedEmail.variants[selectedEmail.variants.length - 1]
      : null;
  const variableSpecs = useMemo(
    () => currentVariant?.variableSchema.variables ?? EMPTY_VARIABLES,
    [currentVariant],
  );

  const previewOptions = PREVIEW_CONTACTS.map((c, i) => ({ value: String(i), label: c.name }));
  const fieldOptions = [
    { value: "", label: "— select field —" },
    ...CSV_FIELDS.map((f) => ({ value: f, label: f })),
  ];
  const matchedCount = useMemo(
    () => variableSpecs.filter((variable) => Boolean(varMap[variable.name]?.field)).length,
    [variableSpecs, varMap],
  );

  useEffect(() => {
    const names = variableSpecs.map((variable) => variable.name);
    setVarMap((prev) => {
      const next = initialVarMap(names);
      for (const name of names) {
        if (prev[name]) next[name] = { field: prev[name].field };
      }
      const prevNames = Object.keys(prev);
      const nextNames = Object.keys(next);
      if (prevNames.length !== nextNames.length) return next;
      for (const name of nextNames) {
        if (!(name in prev)) return next;
        if (prev[name]?.field !== next[name]?.field) return next;
      }
      return prev;
    });
  }, [variableSpecs]);

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      eyebrow={`STEP ${step} OF 5`}
      title={STEP_TITLES[step - 1]}
      footer={
        <>
          <Button
            variant="secondary"
            size="md"
            onClick={() => (step === 1 ? onClose() : setStep((s) => s - 1))}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => (step === 5 ? onSend() : setStep((s) => s + 1))}
            leftIcon={step === 5 ? <Icon name="send" size={12} /> : undefined}
            rightIcon={step === 5 ? undefined : <Icon name="arrow" size={12} />}
          >
            {step === 5 ? "Send campaign" : "Continue"}
          </Button>
        </>
      }
    >
      <ProgressBar
        value={(step / 5) * 100}
        variant="thin"
        aria-label="Campaign wizard progress"
        style={{ marginBottom: 18 }}
      />

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
          <Banner tone="accent">
            <b>
              {matchedCount.toLocaleString()} of {variableSpecs.length.toLocaleString()}
            </b>{" "}
            variables mapped. If a contact misses a mapped field, the component inline default is used.
          </Banner>
          {!currentVariant && (
            <Banner tone="warn">
              No real email variant found yet. Generate an email first to map `variableSchema` values.
            </Banner>
          )}
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
              {variableSpecs.map((variable) => {
                const m = varMap[variable.name];
                const isMatched = !!m?.field;
                return (
                  <div
                    key={variable.name}
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
                        {variable.name}
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
                      <Select
                        selectSize="sm"
                        value={m?.field ?? ""}
                        onChange={(e) =>
                          setVarMap((prev) => ({
                            ...prev,
                            [variable.name]: {
                              ...prev[variable.name],
                              field: e.target.value || null,
                            },
                          }))
                        }
                        options={fieldOptions}
                        aria-label={`Field for ${variable.name}`}
                      />
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
                        Inline default:
                      </span>
                      <Tag tone="neutral" size="sm" sans>
                        {variable.default || "(empty string)"}
                      </Tag>
                      {!isMatched && (
                        <Tag tone="danger" size="sm" sans>
                          not mapped
                        </Tag>
                      )}
                    </div>
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
              <Select
                label="Preview as"
                selectSize="sm"
                value={String(previewIdx)}
                onChange={(e) => setPreviewIdx(Number(e.target.value))}
                options={previewOptions}
              />
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: 7,
                  padding: 12,
                  marginTop: 10,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: "var(--ink)",
                }}
              >
                {(() => {
                  const c = PREVIEW_CONTACTS[previewIdx];
                  return (
                    <>
                      <div style={{ fontWeight: 600 }}>Preview values for {c.name}</div>
                      <div style={{ marginTop: 6, color: "var(--ink-soft)", display: "flex", flexDirection: "column", gap: 4 }}>
                        {variableSpecs.length === 0 ? (
                          <span>No variables found in current variant.</span>
                        ) : (
                          variableSpecs.slice(0, 6).map((variable) => {
                            const mappedField = varMap[variable.name]?.field;
                            const mappedValue = mappedField
                              ? (c.data as Record<string, string | undefined>)[mappedField]
                              : undefined;
                            const resolved =
                              mappedValue && mappedValue !== "—" ? mappedValue : variable.default;
                            return (
                              <div key={variable.name}>
                                <span className="mono">{variable.name}</span>: {resolved || "(empty string)"}
                              </div>
                            );
                          })
                        )}
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
            <SelectableCard
              padded
              selected={schedule === "now"}
              onClick={() => setSchedule("now")}
              title="Send now"
              description={`Goes out immediately to ${audCount.toLocaleString()} contacts`}
            />
            <SelectableCard
              padded
              selected={schedule === "later"}
              onClick={() => setSchedule("later")}
              title="Schedule for later"
              description="Pick a date and time"
            />
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
              <Input label="Date" type="date" defaultValue="2026-04-30" />
              <Input label="Time" type="time" defaultValue="09:00" />
            </div>
          )}
          <Banner tone="accent">
            <Checkbox
              checked={abTest}
              onChange={(e) => setAbTest(e.target.checked)}
              label="Run A/B test on subject lines"
              description="Send 3 variants to 10% of your list, then auto-send the winner to the rest after 4 hours."
            />
          </Banner>
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

          <Banner tone="accent" title="AI prediction" style={{ marginTop: 8 }}>
            Based on your past campaigns, expect{" "}
            <b>~{Math.round(audCount * 0.58).toLocaleString()} opens</b> and{" "}
            <b>~{Math.round(audCount * 0.14).toLocaleString()} clicks</b>.
          </Banner>
        </div>
      )}
    </Modal>
  );
}
