"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "@madoo/ui";
import { consumeEmailSseStream, type StreamEmailEvent } from "@/hooks/use-emails";
import { shortEmailId } from "@/lib/email-id";

const FALLBACK_STEPS = [
  "Reading your prompt…",
  "Studying your audience…",
  "Drafting HTML Coditor layout…",
  "Calling Claude Sonnet…",
  "Rendering HTML preview…",
];

export function GeneratingScreen({
  emailId,
  prompt,
  onDone,
}: {
  emailId: string;
  prompt: string;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [stepLabel, setStepLabel] = useState(FALLBACK_STEPS[0]);
  const [liveSubject, setLiveSubject] = useState<string | null>(null);
  const [codeBytes, setCodeBytes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let highestStep = 0;

    void (async () => {
      try {
        await consumeEmailSseStream(
          `/api/emails/${emailId}/generate`,
          (ev: StreamEmailEvent) => {
            if (ev.type === "step") {
              setStepLabel(ev.message);
              highestStep = Math.min(FALLBACK_STEPS.length - 1, highestStep + 1);
              setStep(highestStep);
              return;
            }
            if (ev.type === "subject") {
              setLiveSubject(ev.value);
              return;
            }
            if (ev.type === "code-chunk") {
              setCodeBytes((v) => v + ev.value.length);
              return;
            }
            if (ev.type === "token_usage") {
              setStepLabel("Finishing up…");
              return;
            }
            if (ev.type === "done") {
              void qc.invalidateQueries({ queryKey: ["email", emailId] });
              void qc.invalidateQueries({ queryKey: ["emails"] });
              setStep(FALLBACK_STEPS.length - 1);
              setStepLabel("Done");
              setTimeout(() => onDoneRef.current(), 400);
              return;
            }
            if (ev.type === "error") {
              setError(ev.message);
            }
          },
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      }
    })();

    // Sin cleanup intencionalmente. En dev React Strict Mode dispara el
    // ciclo setup → cleanup → setup; un `AbortController` aquí mataría
    // la única petición SSE antes de tiempo (y `startedRef` evita
    // disparar una segunda). Si el usuario navega fuera del componente,
    // los setState sobre un componente desmontado son no-op en React 18 y
    // el stream se libera cuando el reader queda sin consumidor.
  }, [emailId, qc]);

  const labels = FALLBACK_STEPS.map((fallback, i) =>
    i === step ? stepLabel : i < step ? fallback : fallback,
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 40,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ display: "inline-flex", position: "relative", width: 80, height: 80, marginBottom: 24 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "var(--accent)",
              opacity: 0.18,
              animation: "pulse 1.6s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 12,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-fg)",
            }}
          >
            <div style={{ animation: "spin 2.4s linear infinite" }}>
              <Icon name="sparkle" size={24} stroke={1.8} />
            </div>
          </div>
        </div>
        <h2
          className="serif"
          style={{ fontSize: 32, fontWeight: 400, margin: 0, lineHeight: 1.1 }}
        >
          <span style={{ fontStyle: "italic" }}>Crafting</span> your email
        </h2>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 8, fontStyle: "italic" }}>
          &quot;{(liveSubject ?? prompt).slice(0, 90)}
          {(liveSubject ?? prompt).length > 90 ? "…" : ""}&quot;
        </p>
        <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 6, fontFamily: "var(--font-jetbrains-mono)" }}>
          {shortEmailId(emailId)}
        </p>
        {codeBytes > 0 ? (
          <p style={{ marginTop: 6, color: "var(--ink-faint)", fontSize: 12 }}>
            Streaming code… {codeBytes} chars
          </p>
        ) : null}
        {error ? (
          <p style={{ marginTop: 16, color: "#b42318", fontSize: 14 }}>{error}</p>
        ) : null}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            textAlign: "left",
          }}
        >
          {labels.map((s, i) => (
            <div
              key={`${s}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13.5,
                color: i <= step ? "var(--ink)" : "var(--ink-faint)",
                transition: "color 0.3s",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    i < step ? "var(--accent)" : i === step ? "var(--accent-soft)" : "var(--surface-2)",
                  color: i < step ? "var(--accent-fg)" : "var(--accent-deep)",
                }}
              >
                {i < step ? (
                  <Icon name="check" size={10} />
                ) : i === step ? (
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      animation: "pulse 1s ease-in-out infinite",
                    }}
                  />
                ) : (
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ink-faint)" }} />
                )}
              </div>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
