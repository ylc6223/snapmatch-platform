"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

/**
 * 这里引入并使用 @dnd-kit 来实现「标签页 Tabbar 的拖拽排序」能力：
 * - DndContext：拖拽上下文容器，负责管理拖拽状态与事件（例如 onDragEnd）。
 * - PointerSensor + useSensor/useSensors：定义用鼠标/触控等指针输入来触发拖拽，并支持组合多个传感器。
 * - closestCenter：碰撞检测策略，用来判断当前拖拽元素“覆盖/最接近”的目标。
 * - SortableContext + useSortable：把列表项变成可排序元素，计算位移 transform/transition，并在拖拽结束时更新顺序。
 *
 * 注意：该库在渲染时会生成一些运行时属性（例如 aria-describedby 的 id）。
 * 在 Next.js 中 Client Component 会先 SSR 输出 HTML，再在浏览器端 hydrate；
 * 如果 SSR 与 CSR 首次渲染生成的 id 不一致，会触发 hydration mismatch（控制台红字）。
 * 为避免这个问题，本文件在首次 hydration 前先渲染“非拖拽版本”，等 mounted 后再启用 DnD 增强。
 */
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, useSortable, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Pin, RefreshCcw, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { appActions, useAppStore } from "@/lib/store/app-store"
import { useSidebar } from "@/components/ui/sidebar"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

export type TabbarMeta = {
  affixTab: boolean
  closable: boolean
  keepAlive: boolean
}

export type TabbarRoute = {
  href: string
  label: string
  meta: TabbarMeta
}

const TABBAR_SCROLL_KEY = "snapmatch-admin:dashboard-tabbar:scroll:v1"

function uniq(list: string[]) {
  return Array.from(new Set(list))
}

function normalizePathname(pathname: string) {
  return pathname.split(/[?#]/)[0]
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SortableTabItem({
  id,
  children,
  disabled,
}: {
  id: string
  children: React.ReactNode
  disabled: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging ? "z-10 opacity-80" : undefined)}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

export function DashboardTabbar({ routes }: { routes: TabbarRoute[] }) {
  const router = useRouter()
  const pathname = normalizePathname(usePathname())
  const { isMobile } = useSidebar()
  // mounted 后再启用 DnD，保证 SSR 与 CSR 首次输出一致，避免 hydration mismatch。
  const [hydrated, setHydrated] = React.useState(false)

  const stored = useAppStore((s) => s.tabbar)

  React.useEffect(() => {
    setHydrated(true)
  }, [])

  const routeMap = React.useMemo(() => {
    const map = new Map<string, TabbarRoute>()
    routes.forEach((route) => map.set(route.href, route))
    return map
  }, [routes])

  const affixHrefs = React.useMemo(
    () => routes.filter((r) => r.meta.affixTab).map((r) => r.href),
    [routes]
  )

  const isPinned = React.useCallback(
    (href: string) => stored.pinned.includes(href) || affixHrefs.includes(href),
    [stored.pinned, affixHrefs]
  )

  const visibleHrefs = React.useMemo(() => {
    const knownHrefs = routes.map((r) => r.href)

    const baseOrder =
      stored.order.length > 0 ? stored.order.filter((h) => knownHrefs.includes(h)) : knownHrefs

    const ensureAll = uniq([...baseOrder, ...knownHrefs])
    const closed = new Set(stored.closed)

    const visibles = ensureAll.filter((href) => !closed.has(href))
    const pinned = visibles.filter((href) => isPinned(href))
    const normal = visibles.filter((href) => !isPinned(href))
    return [...pinned, ...normal]
  }, [routes, stored.order, stored.closed, isPinned])

  const activeHref = React.useMemo(() => {
    const candidate = visibleHrefs.find((href) => isActivePath(pathname, href))
    return candidate ?? "/dashboard/analytics"
  }, [pathname, visibleHrefs])

  const pathnameRef = React.useRef(pathname)
  React.useEffect(() => {
    if (pathnameRef.current === pathname) return

    const previousPath = pathnameRef.current
    pathnameRef.current = pathname

    const previousRoute = routes.find((r) => isActivePath(previousPath, r.href))
    const currentRoute = routes.find((r) => isActivePath(pathname, r.href))

    try {
      const raw = window.sessionStorage.getItem(TABBAR_SCROLL_KEY) ?? "{}"
      const map = JSON.parse(raw) as Record<string, number>

      if (previousRoute?.meta.keepAlive) {
        map[previousRoute.href] = window.scrollY
        window.sessionStorage.setItem(TABBAR_SCROLL_KEY, JSON.stringify(map))
      }

      if (currentRoute?.meta.keepAlive && typeof map[currentRoute.href] === "number") {
        window.requestAnimationFrame(() => window.scrollTo(0, map[currentRoute.href]!))
      }
    } catch {
      // ignore
    }
  }, [pathname, routes])

  React.useEffect(() => {
    const current = routes.find((r) => isActivePath(pathname, r.href))
    if (!current) return

    appActions.tabbarSet((prev) => {
      const closed = prev.closed.filter((href) => href !== current.href)
      const order = prev.order.length ? prev.order : routes.map((r) => r.href)
      return { closed, order: uniq(order) }
    })
  }, [pathname, routes])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const reorder = React.useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return
      const activePinned = isPinned(activeId)
      const overPinned = isPinned(overId)
      if (activePinned !== overPinned) return

      const current = [...visibleHrefs]
      const oldIndex = current.indexOf(activeId)
      const newIndex = current.indexOf(overId)
      if (oldIndex < 0 || newIndex < 0) return

      const nextVisible = arrayMove(current, oldIndex, newIndex)
      appActions.tabbarSet({ order: uniq(nextVisible) })
    },
    [isPinned, visibleHrefs]
  )

  const onClose = React.useCallback(
    (href: string) => {
      const route = routeMap.get(href)
      if (!route) return
      if (!route.meta.closable || isPinned(href)) return

      appActions.tabbarSet((prev) => ({ closed: uniq([...prev.closed, href]) }))

      if (href === activeHref) {
        const remaining = visibleHrefs.filter((h) => h !== href && !stored.closed.includes(h))
        const fallback =
          remaining.find((h) => isPinned(h)) ?? remaining[0] ?? "/dashboard/analytics"
        router.push(fallback)
      }
    },
    [routeMap, isPinned, activeHref, visibleHrefs, stored.closed, router]
  )

  const closeAll = React.useCallback(() => {
    const closable = visibleHrefs.filter((href) => {
      const route = routeMap.get(href)
      if (!route) return false
      return route.meta.closable && !isPinned(href)
    })

    appActions.tabbarSet((prev) => ({ closed: uniq([...prev.closed, ...closable]) }))

    const fallback = visibleHrefs.find((h) => isPinned(h)) ?? "/dashboard/analytics"
    router.push(fallback)
  }, [visibleHrefs, routeMap, isPinned, router])

  const closeOthers = React.useCallback(
    (targetHref: string) => {
      const closable = visibleHrefs.filter((href) => {
        if (href === targetHref) return false
        const route = routeMap.get(href)
        if (!route) return false
        return route.meta.closable && !isPinned(href)
      })

      appActions.tabbarSet((prev) => ({ closed: uniq([...prev.closed, ...closable]) }))
      router.push(targetHref)
    },
    [visibleHrefs, routeMap, isPinned, router]
  )

  const closeLeft = React.useCallback(
    (targetHref: string) => {
      const index = visibleHrefs.indexOf(targetHref)
      if (index <= 0) return
      const left = visibleHrefs.slice(0, index)

      const closable = left.filter((href) => {
        const route = routeMap.get(href)
        if (!route) return false
        return route.meta.closable && !isPinned(href)
      })
      appActions.tabbarSet((prev) => ({ closed: uniq([...prev.closed, ...closable]) }))
      router.push(targetHref)
    },
    [visibleHrefs, routeMap, isPinned, router]
  )

  const closeRight = React.useCallback(
    (targetHref: string) => {
      const index = visibleHrefs.indexOf(targetHref)
      if (index < 0 || index === visibleHrefs.length - 1) return
      const right = visibleHrefs.slice(index + 1)

      const closable = right.filter((href) => {
        const route = routeMap.get(href)
        if (!route) return false
        return route.meta.closable && !isPinned(href)
      })
      appActions.tabbarSet((prev) => ({ closed: uniq([...prev.closed, ...closable]) }))
      router.push(targetHref)
    },
    [visibleHrefs, routeMap, isPinned, router]
  )

  const togglePin = React.useCallback(
    (href: string) => {
      if (affixHrefs.includes(href)) return
      appActions.tabbarSet((prev) => {
        const pinned = new Set(prev.pinned)
        if (pinned.has(href)) pinned.delete(href)
        else pinned.add(href)
        return { pinned: Array.from(pinned) }
      })
    },
    [affixHrefs]
  )

  const refresh = React.useCallback(
    (href: string) => {
      if (href !== activeHref) {
        router.push(href)
        return
      }
      router.refresh()
    },
    [activeHref, router]
  )

  if (routes.length === 0) return null

  const content = (
    <div className="flex w-full items-center gap-1 overflow-x-auto">
      {visibleHrefs.map((href) => {
        const route = routeMap.get(href)
        if (!route) return null

        const active = href === activeHref
        const pinned = isPinned(href)
        const canClose = route.meta.closable && !pinned && visibleHrefs.length > 1
        const dragDisabled = isMobile

        const item = (
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div
                className={cn(
                  "group/tab relative flex h-9 shrink-0 items-center rounded-md border px-2 text-sm",
                  active
                    ? "bg-primary/10 text-foreground border-border"
                    : "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2 pr-1",
                    dragDisabled ? "cursor-pointer" : "cursor-grab"
                  )}
                >
                  {pinned ? <Pin className="size-3.5 opacity-70" /> : null}
                  <span className="max-w-[10rem] truncate">{route.label}</span>
                </Link>

                <div className="ml-1 flex items-center gap-1">
                  {canClose ? (
                    <button
                      type="button"
                      aria-label="Close tab"
                      className="text-muted-foreground hover:text-foreground rounded-sm p-1"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onClose(href)
                      }}
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem disabled={href !== activeHref} onSelect={() => refresh(href)}>
                <RefreshCcw className="mr-2 size-4" />
                刷新
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem disabled={!canClose} onSelect={() => onClose(href)}>
                关闭
              </ContextMenuItem>
              <ContextMenuItem disabled={visibleHrefs.length <= 1} onSelect={() => closeOthers(href)}>
                关闭其他
              </ContextMenuItem>
              <ContextMenuItem
                disabled={visibleHrefs.indexOf(href) <= 0}
                onSelect={() => closeLeft(href)}
              >
                关闭左侧
              </ContextMenuItem>
              <ContextMenuItem
                disabled={visibleHrefs.indexOf(href) === visibleHrefs.length - 1}
                onSelect={() => closeRight(href)}
              >
                关闭右侧
              </ContextMenuItem>
              <ContextMenuItem disabled={visibleHrefs.length <= 1} onSelect={closeAll}>
                关闭全部
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem disabled={affixHrefs.includes(href)} onSelect={() => togglePin(href)}>
                {pinned && !affixHrefs.includes(href) ? "取消固定" : "固定"}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )

        return hydrated ? (
          <SortableTabItem key={href} id={href} disabled={dragDisabled}>
            {item}
          </SortableTabItem>
        ) : (
          <div key={href}>{item}</div>
        )
      })}
    </div>
  )

  return (
    <div className="w-full overflow-hidden px-4">
      {hydrated ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const activeId = String(event.active.id)
            const overId = event.over?.id ? String(event.over.id) : null
            if (!overId) return
            reorder(activeId, overId)
          }}
        >
          <SortableContext items={visibleHrefs} strategy={horizontalListSortingStrategy}>
            {content}
          </SortableContext>
        </DndContext>
      ) : (
        content
      )}
    </div>
  )
}
