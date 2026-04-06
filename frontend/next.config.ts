import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/((?!auth).*)",
        destination: "http://localhost:8000/api/:1",
      },
    ];
  },
};

export default nextConfig;
