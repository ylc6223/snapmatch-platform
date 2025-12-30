import type { NextConfig } from "next";

const adminBasePath = "/admin";

const nextConfig: NextConfig = {
  output: 'standalone',  // 🔥 关键: standalone
  basePath: adminBasePath,  // 🔥 关键: Admin 在 /admin 路径
  // API Route Handler 依赖“无尾斜杠”路径（例如 /api/auth/login），否则会触发 308 → /api/auth/login/ 并导致 404。
  trailingSlash: false,
  async rewrites() {
    // basePath 会影响到 Next.js 的 app router（包含 app/api/），导致：
    // - Route Handler 实际路径：/admin/api/*
    // - 但浏览器与 Nginx 仍按约定访问：/api/*
    // 因此：将 /api/* 重写到 /admin/api/*，保持现有调用不变。
    return [
      {
        source: "/api/:path*",
        destination: `${adminBasePath}/api/:path*`,
      },
    ];
  },
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
