"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export type RouteTab = {
  href: string
  label: string
}

export function RouteTabs({
  tabs,
  className,
}: {
  tabs: RouteTab[]
  className?: string
}) {
  const pathname = usePathname()
  const normalizedPathname = pathname.split(/[?#]/)[0]

  const isActive = React.useCallback(
    (href: string) => normalizedPathname === href || normalizedPathname.startsWith(`${href}/`),
    [normalizedPathname]
  )

  if (tabs.length <= 1) return null

  return (
    <nav aria-label="Dashboard tabs" className={className}>
      <div className="bg-muted text-muted-foreground inline-flex h-9 w-full items-center gap-1 overflow-x-auto rounded-lg p-[3px]">
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex h-[calc(100%-1px)] shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                active
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/60 hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

