import React from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { getAdminAccessToken } from "@/lib/auth/session"
import type { AuthUser } from "@/lib/auth/types"
import type { ApiResponse } from "@/lib/api/response"
import {
  buildDashboardTabLabelFromHref,
  resolveDashboardTab,
  type DashboardTab,
} from "@/lib/navigation/dashboard-tabs"
import { withAdminBasePath } from "@/lib/routing/base-path"

import { promises as fs } from "fs"
import path from "path"

async function getDashboardTabs() {
  const dashboardDir = path.join(process.cwd(), "app", "dashboard")
  const tabs: DashboardTab[] = []

  const rootPage = path.join(dashboardDir, "page.tsx")
  try {
    await fs.access(rootPage)
    tabs.push({ href: "/dashboard", label: buildDashboardTabLabelFromHref("/dashboard") })
  } catch {
    // ignore
  }

  const entries = await fs.readdir(dashboardDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue
    if (entry.name.startsWith("(") && entry.name.endsWith(")")) continue
    if (entry.name.startsWith("[") && entry.name.endsWith("]")) continue

    const pagePath = path.join(dashboardDir, entry.name, "page.tsx")
    try {
      await fs.access(pagePath)
      const href = `/dashboard/${entry.name}`
      tabs.push({ href, label: buildDashboardTabLabelFromHref(href) })
    } catch {
      // ignore
    }
  }

  return tabs
    .map((tab) => resolveDashboardTab(tab))
    .filter((tab) => !tab.hidden)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map(({ href, label, affixTab, tabClosable, keepAlive }) => ({
      href,
      label,
      meta: {
        affixTab,
        closable: tabClosable,
        keepAlive,
      },
    }))
}

export default async function Page({ children }: { children: React.ReactNode }) {
  let user: AuthUser
  try {
    const requestHeaders = await Promise.resolve(headers())
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
    const proto = requestHeaders.get("x-forwarded-proto") ?? "http"
    if (!host) throw new Error("Missing request host")

    const accessToken =
      requestHeaders.get("x-admin-access-token") ?? (await getAdminAccessToken())
    if (!accessToken) redirect(withAdminBasePath("/login?next=/dashboard"))

    const response = await fetch(
      new URL("/api/v1/auth/me", process.env.BACKEND_BASE_URL ?? "http://localhost:3002"),
      {
        method: "GET",
        headers: { accept: "application/json", authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    )

    if (response.status === 401) redirect(withAdminBasePath("/session-expired?next=/dashboard"))
    const result = (await response.json()) as ApiResponse<{ user: AuthUser }>
    const current = result.data?.user
    if (!current) {
      throw new Error("Invalid /api/v1/auth/me response: missing user")
    }
    user = current
  } catch (error) {
    throw error
  }

  const tabs = await getDashboardTabs()

  return (
    <SidebarProvider
      className="h-svh overflow-hidden"
    >
      <AppSidebar user={user} />
      <SidebarInset className="flex-1 min-h-0 overflow-hidden">
        <SiteHeader tabbarRoutes={tabs} />
        <div className="flex min-h-0 flex-1 flex-col overflow-auto overscroll-contain">
          <main className="flex flex-col gap-4 p-4 pt-0">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
