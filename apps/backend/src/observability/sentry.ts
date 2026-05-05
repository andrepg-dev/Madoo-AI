import * as Sentry from "@sentry/node";

/**
 * Initialise Sentry once, at process boot. No-op when SENTRY_DSN is unset
 * so local dev stays quiet. Captures uncaught exceptions and unhandled
 * rejections automatically.
 */
export function initSentry(): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0"),
    release: process.env.SENTRY_RELEASE,
  });
  return true;
}

export { Sentry };
