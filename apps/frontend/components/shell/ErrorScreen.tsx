"use client";

import { useEffect } from "react";
import { Banner, Button, Card } from "@madoo/design-system";
import * as Sentry from "@sentry/nextjs";

export function ErrorScreen({
  title = "Something went wrong",
  error,
  reset,
}: {
  title?: string;
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    } else if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.error("[error-screen]", error);
    }
  }, [error]);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
      <div style={{ maxWidth: 560, margin: "80px auto", padding: "0 24px" }}>
        <Card padded>
          <h2
            className="display"
            style={{ fontSize: 26, fontWeight: 400, marginBottom: 8, letterSpacing: -0.3 }}
          >
            {title}
          </h2>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>
            We hit an unexpected error rendering this screen. The team has been notified.
          </p>
          <Banner tone="danger" style={{ marginBottom: 16 }}>
            {error.message || "Unknown error"}
            {error.digest ? ` · digest ${error.digest}` : ""}
          </Banner>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="primary" size="md" onClick={reset}>
              Try again
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = "/";
              }}
            >
              Back to home
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
