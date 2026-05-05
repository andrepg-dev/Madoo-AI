import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  transpilePackages: ["@madoo/shared", "@madoo/ui"],
  // Sentry pulls OpenTelemetry instrumentation that can't be statically
  // analyzed by webpack. Marking these as external avoids spurious build
  // warnings and "Cannot find module" runtime hiccups while collecting
  // page data.
  serverExternalPackages: [
    "@sentry/node",
    "@sentry/nextjs",
    "@opentelemetry/instrumentation",
    "@opentelemetry/sdk-node",
    "require-in-the-middle",
  ],
};

export default nextConfig;
