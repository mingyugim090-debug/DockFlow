import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/((?!auth).*)",
        destination: `${backendUrl}/api/:1`,
      },
    ];
  },
};

export default nextConfig;
