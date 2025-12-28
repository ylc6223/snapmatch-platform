import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',  // 🔥 关键: standalone
  basePath: '/admin',  // 🔥 关键: Admin 在 /admin 路径
  trailingSlash: true,  // 生成 /admin/about/index.html
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
