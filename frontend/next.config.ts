import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  // Environment variables accessible in the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
  // Fix Turbopack workspace root detection for monorepo
  turbopack: {
    root: ".",
  },
};

export default nextConfig;
