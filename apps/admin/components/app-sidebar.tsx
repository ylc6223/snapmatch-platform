"use client";

import * as React from "react"
import {
  IconCamera,
  IconChartBar, IconCircle,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconFolder,
  IconInnerShadowTop,
  IconListDetails,
  IconUsers
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import type { AuthUser, Role } from "@/lib/auth/types";
import { canAccess } from "@/lib/auth/can";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: IconListDetails,
      roles: ["admin"] satisfies Role[],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconChartBar,
    },
    {
      title: "404 Page",
      url: "/404-page",
      icon: IconFolder,
    },
    {
      title: "500 Page",
      url: "/500-page",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Get Pro",
      url: "https://shadcnuikit.com/pricing",
      icon: IconCircle,
    },
    {
      title: "Shadcn UI Kit",
      url: "https://shadcnuikit.com/",
      icon: IconCircle,
    },
    {
      title: "Bundui Component",
      url: "https://bundui.io",
      icon: IconCircle,
    },
  ],
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: AuthUser }) {
  const navMain = data.navMain.filter((item) => canAccess(user, item));
  const rolesLabel = user.roles.length > 0 ? user.roles.join(", ") : "unknown";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <img src="https://shadcnuikit.com/logo.png" className="size-6 rounded-sm group-data-[collapsible=icon]:size-5" alt="shadcn ui kit svg logo" />
                <span className="text-base font-medium">Shadcn UI Kit</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.account,
            email: rolesLabel,
            avatar: ""
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
