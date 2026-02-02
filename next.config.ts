import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Silence Next's "inferred workspace root" warning in monorepo-ish setups.
    root: __dirname,
  },
};

export default nextConfig;
