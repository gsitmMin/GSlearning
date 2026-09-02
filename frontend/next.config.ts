import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // BACKEND_ORIGIN이 설정되면 /api/* 를 Spring Boot(/api/v2/*)로 프록시.
    // beforeFiles라 목 API(app/api/**)보다 우선한다. 비우면 목 API로 폴백.
    const backend = process.env.BACKEND_ORIGIN;
    if (!backend) return [];
    return {
      beforeFiles: [
        { source: "/api/:path*", destination: `${backend}/api/v2/:path*` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
