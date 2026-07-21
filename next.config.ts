import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Offseason: the live Tournament and Players pages were retired
  // 2026-07-21; their URLs land on the tournament review.
  async redirects() {
    return [
      { source: "/tournament", destination: "/", permanent: true },
      { source: "/players", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
