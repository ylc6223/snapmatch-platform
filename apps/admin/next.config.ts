import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',  // 🔥 关键: standalone
  basePath: '/admin',  // 🔥 关键: Admin 在 /admin 路径
  // API Route Handler 依赖“无尾斜杠”路径（例如 /api/auth/login），否则会触发 308 → /api/auth/login/ 并导致 404。
  trailingSlash: false,
  typescript: {
    ignoreBuildErrors: false,  // 生产构建严格模式
  },
  images: {
    unoptimized: true,  // 静态托管必需
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      },
      {
        protocol: "http",
        hostname: "**"
      }
    ]
  }
};

export default nextConfig;
