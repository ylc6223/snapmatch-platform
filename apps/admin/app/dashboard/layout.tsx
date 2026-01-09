import React from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { DashboardLayoutClient } from "./dashboard-layout-client"

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

  // 约定：settings 不提供 index page，但需要在 tabbar 提供入口，默认指向 accounts。
  const settingsAccountsPage = path.join(dashboardDir, "settings", "accounts", "page.tsx")
  try {
    await fs.access(settingsAccountsPage)
    tabs.push({
      href: "/dashboard/settings/accounts",
      label: buildDashboardTabLabelFromHref("/dashboard/settings/accounts"),
    })
  } catch {
    // ignore
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
    if (!accessToken) redirect(withAdminBasePath("/login?next=/dashboard/analytics"))

    const backendBaseUrl = process.env.BACKEND_BASE_URL
    if (!backendBaseUrl) {
      throw new Error(
        "Missing environment variable: BACKEND_BASE_URL. " +
        "Please set it in .env.local (see .env.example for reference)"
      )
    }

    const response = await fetch(
      new URL("/api/v1/auth/me", backendBaseUrl),
      {
        method: "GET",
        headers: { accept: "application/json", authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    )

    if (response.status === 401) {
      redirect(withAdminBasePath("/session-expired?next=/dashboard/analytics"))
    }
    if (response.status === 403) {
      redirect(withAdminBasePath("/forbidden?next=/dashboard/analytics"))
    }
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
    <DashboardLayoutClient user={user} tabs={tabs}>
      {children}
    </DashboardLayoutClient>
  )
}
