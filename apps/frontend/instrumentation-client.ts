import * as Sentry from "@sentry/nextjs";

/**
 * Browser-side Sentry init. Next.js auto-detects this file and runs it
 * before hydration. Stays a no-op when the DSN isn't configured.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0",
    ),
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
