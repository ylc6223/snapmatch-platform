import { toNavigationLabel } from "@/lib/navigation/labels"

export type DashboardTab = {
  href: string
  label: string
}

export type DashboardTabConfig = {
  hidden?: boolean
  label?: string
  order?: number
  affixTab?: boolean
  tabClosable?: boolean
  keepAlive?: boolean
}

// 说明：
// - 默认会把 /dashboard 下所有 page.tsx 页面加入 Tabs
// - 如需隐藏/改名/排序，在这里按 href 做覆盖即可
export const DASHBOARD_TAB_CONFIG: Record<string, DashboardTabConfig> = {
  "/dashboard": { label: "Dashboard", order: 0, affixTab: true },
  "/dashboard/settings/accounts": { label: "Settings", order: 20 },
}

export type DashboardResolvedTab = DashboardTab & {
  hidden: boolean
  order: number
  affixTab: boolean
  tabClosable: boolean
  keepAlive: boolean
}

export function resolveDashboardTab(tab: DashboardTab): DashboardResolvedTab {
  const config = DASHBOARD_TAB_CONFIG[tab.href]
  return {
    ...tab,
    label: config?.label ?? tab.label,
    hidden: Boolean(config?.hidden),
    order: config?.order ?? 1000,
    affixTab: Boolean(config?.affixTab),
    tabClosable: Reflect.has(config ?? {}, "tabClosable") ? Boolean(config?.tabClosable) : true,
    keepAlive: Boolean(config?.keepAlive),
  }
}

export function buildDashboardTabLabelFromHref(href: string) {
  const segment = href.split("/").filter(Boolean).at(-1) ?? "dashboard"
  return toNavigationLabel(segment)
}
