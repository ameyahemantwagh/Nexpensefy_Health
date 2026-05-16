import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker: produces a self-contained server.js in .next/standalone
  output: "standalone",
};

export default nextConfig;
