import React from "react";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { backendFetch, BackendError } from "@/lib/api/backend";
import type { AuthUser } from "@/lib/auth/types";


export default async function Page({ children }: { children: React.ReactNode }) {
  let user: AuthUser;
  try {
    const result = await backendFetch<{ user: AuthUser }>("/auth/me");
    user = result.user;
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      redirect("/login?next=/dashboard");
    }
    throw error;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar user={user} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4  md:gap-6 p-4 lg:p-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
