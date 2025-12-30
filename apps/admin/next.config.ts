import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',  // 🔥 关键: standalone
  // API Route Handler 依赖“无尾斜杠”路径（例如 /api/auth/login），否则会触发 308 → /api/auth/login/ 并导致 404。
  trailingSlash: false,
  async rewrites() {
    // 保持 API 位于根路径 `/api/*`，避免 basePath 导致的 308/404（API 在 /admin/api 下不可被 /api 访问）。
    //
    // 同时兼容 “Admin 在 /admin 路径” 的访问习惯：把 /admin/* 重写到根路径的同名路由。
    // 例：
    // - /admin/login    -> /login
    // - /admin/dashboard -> /dashboard
    // - /admin/api/auth/login -> /api/auth/login
    return [
      {
        source: "/admin/:path*",
        destination: "/:path*",
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
