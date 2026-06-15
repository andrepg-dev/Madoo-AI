import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  transpilePackages: ["@madoo/design-system"],
  experimental: {
    // Image uploads flow through a Server Action; allow up to ~10 MB (the
    // backend caps images at 8 MB) instead of the 1 MB default.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
