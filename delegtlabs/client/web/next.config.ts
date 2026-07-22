import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/web/:path*",
        destination: "http://localhost:8000/web/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
