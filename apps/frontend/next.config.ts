import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  transpilePackages: ["@madoo/shared", "@madoo/ui"],
};

export default nextConfig;
