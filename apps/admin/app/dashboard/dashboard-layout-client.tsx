"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { AuthUser } from "@/lib/auth/types";
import type { DashboardTab } from "@/lib/navigation/dashboard-tabs";

interface DashboardLayoutClientProps {
  user: AuthUser;
  tabs: Array<{
    href: string;
    label: string;
    meta: {
      affixTab: boolean;
      closable: boolean;
      keepAlive: boolean;
    };
  }>;
  children: React.ReactNode;
}

/**
 * Dashboard layout client wrapper
 *
 * Conditionally renders shadcn layout based on route:
 * - Portfolio routes (/dashboard/portfolio/*): Skip shadcn Sidebar and SiteHeader
 * - Other routes: Render full shadcn layout
 */
export function DashboardLayoutClient({
  user,
  tabs,
  children,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();

  // Check if current route is a portfolio route
  const isPortfolioRoute = pathname?.startsWith("/dashboard/portfolio");

  // For portfolio routes, render children without shadcn layout
  // Portfolio has its own lumina layout in (lumina)/portfolio/layout.tsx
  if (isPortfolioRoute) {
    return <>{children}</>;
  }

  // For other dashboard routes, render full shadcn layout
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar user={user} />
      <SidebarInset className="flex-1 min-h-0 overflow-hidden">
        <SiteHeader tabbarRoutes={tabs} />
        <div className="flex min-h-0 flex-1 flex-col overflow-auto overscroll-contain">
          <main className="flex flex-col gap-4 p-4 pt-0">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
