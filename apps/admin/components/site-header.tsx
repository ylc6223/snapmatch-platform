"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { DashboardTabbar, type TabbarRoute } from "@/components/dashboard-tabbar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { toNavigationLabel } from "@/lib/navigation/labels"

export function SiteHeader({ tabbarRoutes }: { tabbarRoutes?: TabbarRoute[] }) {
  const pathname = usePathname()

  const crumbs = React.useMemo(() => {
    const segments = pathname.split(/[?#]/)[0].split("/").filter(Boolean)
    const dashboardIndex = segments.indexOf("dashboard")
    const effectiveSegments =
      dashboardIndex >= 0 ? segments.slice(dashboardIndex) : segments

    if (effectiveSegments.length === 0) {
      return [{ label: "Dashboard", href: "/dashboard", current: true }]
    }

    return effectiveSegments.map((segment, index) => {
      const href = `/${effectiveSegments.slice(0, index + 1).join("/")}`
      return {
        label: toNavigationLabel(segment),
        href,
        current: index === effectiveSegments.length - 1,
      }
    })
  }, [pathname])

  return (
    <header className="sticky top-0 z-20 flex shrink-0 flex-col gap-2 border-b bg-background py-3">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                {index > 0 ? <BreadcrumbSeparator className="hidden md:block" /> : null}
                {crumb.current ? (
                  <BreadcrumbItem>
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                ) : (
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  </BreadcrumbItem>
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {tabbarRoutes?.length ? <DashboardTabbar routes={tabbarRoutes} /> : null}
    </header>
  )
}
