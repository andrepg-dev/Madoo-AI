import * as Sentry from "@sentry/nextjs";

/**
 * Next.js calls this once per runtime (Node, Edge). We forward to the
 * Sentry hooks so server-side errors are captured.
 */
export async function register(): Promise<void> {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0"),
      release: process.env.SENTRY_RELEASE,
    });
  } else if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0"),
      release: process.env.SENTRY_RELEASE,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
