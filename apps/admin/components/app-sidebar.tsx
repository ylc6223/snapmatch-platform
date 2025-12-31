"use client";

import * as React from "react";
import {
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconListDetails,
  IconPhoto,
  IconSettings,
  IconStack2,
  IconTruckDelivery,
  IconUsers
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";

import type { AuthUser, Role } from "@/lib/auth/types";
import { canAccess } from "@/lib/auth/can";

const data = {
  navMain: [
    {
      title: "工作台",
      url: "/dashboard",
      icon: IconDashboard,
      permissions: ["page:dashboard", "dashboard:view"],
      items: [
        { title: "数据概览", url: "/dashboard/analytics" },
        { title: "快捷入口", url: "/dashboard/shortcuts" }
      ]
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: IconListDetails,
      roles: ["admin"] satisfies Role[]
    },
    {
      title: "作品集管理",
      url: "/dashboard/portfolio",
      icon: IconPhoto,
      permissions: ["page:assets"],
      items: [
        { title: "作品列表", url: "/dashboard/portfolio/works" },
        { title: "分类管理", url: "/dashboard/portfolio/categories" },
        { title: "轮播图配置", url: "/dashboard/portfolio/banners" }
      ]
    },
    {
      title: "交付与选片",
      url: "/dashboard/delivery",
      icon: IconTruckDelivery,
      permissions: ["page:assets"],
      items: [
        { title: "项目创建", url: "/dashboard/delivery/projects/new" },
        { title: "照片库", url: "/dashboard/delivery/photos" },
        { title: "选片链接", url: "/dashboard/delivery/viewer-links" },
        { title: "精修交付", url: "/dashboard/delivery/retouch" }
      ]
    },
    {
      title: "客户与订单",
      url: "/dashboard/crm",
      icon: IconUsers,
      permissions: ["page:packages"],
      items: [
        { title: "客户档案", url: "/dashboard/crm/customers" },
        { title: "订单列表", url: "/dashboard/crm/orders" }
      ]
    },
    {
      title: "系统设置",
      url: "/dashboard/settings",
      icon: IconSettings,
      permissions: ["page:settings"],
      items: [
        { title: "账号与权限", url: "/dashboard/settings/accounts" },
        { title: "存储配置", url: "/dashboard/settings/storage" },
        { title: "小程序配置", url: "/dashboard/settings/miniprogram" }
      ]
    },
    {
      title: "示例页面",
      url: "#",
      icon: IconStack2,
      items: [
        { title: "404 Page", url: "/404-page" },
        { title: "500 Page", url: "/500-page" }
      ]
    }
  ],
  navSecondary: []
};

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
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <img
                  src="https://shadcnuikit.com/logo.png"
                  className="size-6 rounded-sm group-data-[collapsible=icon]:size-5"
                  alt="shadcn ui kit svg logo"
                />
                <span className="text-base font-medium">Shadcn UI Kit</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} label="Main" />
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
  );
}
