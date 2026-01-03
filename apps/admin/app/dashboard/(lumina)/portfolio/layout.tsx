import React from "react";
import { authenticateUser } from "@/lib/layout/auth-layout";
import { PortfolioSidebarClient } from "./portfolio-sidebar-client";

/**
 * Portfolio模块专属Layout
 *
 * 采用lumina-lens设计风格：
 * - 浮动Sidebar（不占用布局空间）
 * - 无SiteHeader（简化设计）
 * - 全屏内容区域
 *
 * 与dashboard/layout的区别：
 * 1. 不使用shadcn SidebarProvider/SidebarInset
 * 2. 不显示SiteHeader（Tab、用户菜单等）
 * 3. Portfolio子页面使用浮动导航设计
 */
export default async function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 认证并获取用户信息
  const user = await authenticateUser();

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-background to-muted -z-10" />

      {/*
        滚动遮罩 / 天花板
        阻止内容在滚动时被看到在浮动FilterBar区域后面。
        它位于 z-10（内容上方，FilterBar z-30 下方）。
      */}
      <div className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-background via-background/95 to-transparent z-10 pointer-events-none" />

      {/* 浮动侧边栏（左侧）- 使用client component包装 */}
      <PortfolioSidebarClient user={user} />

      {/* 主内容区域
          pl-24: 为浮动Sidebar留出空间（避免内容被遮挡）
          pl-0在mobile端（因为Sidebar隐藏）
      */}
      <main className="w-full h-full overflow-y-auto pl-0 md:pl-24">
        {children}
      </main>
    </div>
  );
}
