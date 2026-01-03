"use client";

import { Sidebar } from "./works/components/Sidebar";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Portfolio Sidebar的客户端包装组件
 *
 * 必须是单独的client component文件，因为：
 * 1. layout.tsx是async server component（需要认证）
 * 2. Sidebar使用了hooks（usePathname, useTheme等）
 * 3. "use client"指令必须在文件顶部
 */
export function PortfolioSidebarClient({ user }: { user: AuthUser }) {
  return <Sidebar user={user} />;
}
