"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"
import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon?: Icon
  items?: { title: string; url: string }[]
}

export function NavMain({
  items,
  label,
  showQuickActions = true,
}: {
  items: NavItem[]
  label?: string
  showQuickActions?: boolean
}) {
  const pathname = usePathname()
  const { isMobile, state } = useSidebar()

  const normalizedPathname = pathname.split(/[?#]/)[0]
  const shouldUseDropdownSubmenu = !isMobile && state === "collapsed"

  const isActive = React.useCallback(
    (href: string) => {
      if (href === "#") return false
      if (href === "/dashboard") return normalizedPathname === "/dashboard"
      return normalizedPathname === href || normalizedPathname.startsWith(`${href}/`)
    },
    [normalizedPathname]
  )

  return (
    <SidebarGroup>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarGroupContent className="flex flex-col gap-2">
        {showQuickActions ? (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              {/* <SidebarMenuButton
                tooltip="Quick Create"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <IconCirclePlusFilled />
                <span>Create Project</span>
              </SidebarMenuButton> */}
              {/* <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
              >
                <IconMail />
                <span className="sr-only">Inbox</span>
              </Button> */}
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
        <SidebarMenu>
          {items.map((item) => {
            const hasChildren = Boolean(item.items && item.items.length > 0)
            const itemIsActive =
              isActive(item.url) || (item.items?.some((child) => isActive(child.url)) ?? false)

            if (!hasChildren) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} isActive={itemIsActive} asChild>
                    <Link href={item.url}>
                      {item.icon ? <item.icon /> : null}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            if (shouldUseDropdownSubmenu) {
              return (
                <DropdownMenu key={item.title}>
                  <SidebarMenuItem>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={itemIsActive}
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                      >
                        {item.icon ? <item.icon /> : null}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="min-w-56 rounded-lg">
                      {item.items?.map((child) => (
                        <DropdownMenuItem key={child.title} asChild>
                          <Link href={child.url}>{child.title}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </SidebarMenuItem>
                </DropdownMenu>
              )
            }

            return (
              <SidebarMenuItem key={item.title}>
                <Collapsible defaultOpen={itemIsActive} className="group/collapsible">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={itemIsActive}>
                      {item.icon ? <item.icon /> : null}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((child) => (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(child.url)}>
                            <Link href={child.url}>
                              <span>{child.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
