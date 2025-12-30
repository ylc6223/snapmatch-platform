import type { NextConfig } from "next";

function normalizeBasePath(input: string | undefined) {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  if (raw === "/") return "";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

const adminBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_ADMIN_BASE_PATH) || "/admin";

const nextConfig: NextConfig = {
  output: 'standalone',  // 🔥 关键: standalone
  // 约定：Admin 在 /admin 路径；可通过 NEXT_PUBLIC_ADMIN_BASE_PATH 覆盖（需在 dev/build 时提供）。
  basePath: adminBasePath,
  // API Route Handler 依赖“无尾斜杠”路径（例如 /admin/api/auth/login），否则会触发 308 → /admin/api/auth/login/ 并导致 404。
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
