type PageRoutesType = {
  title: string;
  items: PageRoutesItemType;
};

/**
 * 侧边栏路由配置
 *
 * 说明：
 * - 这是纯“展示层菜单”配置，不代表后端权限；权限由后端 Guard 强校验
 * - 若要基于 roles/permissions 做菜单过滤，建议在渲染侧结合 `lib/auth/can.ts`
 */
type PageRoutesItemType = {
  title: string;
  href: string;
  icon?: string;
  isComing?: boolean;
  items?: PageRoutesItemType;
}[];

export const page_routes: PageRoutesType[] = [
  {
    title: "Menu",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard/default",
        icon: "PieChart"
      },
      { title: "Users", href: "/dashboard/pages/users", icon: "Users" },
      {
        title: "Settings",
        href: "/dashboard/pages/settings",
        icon: "Settings"
      },
      {
        title: "Authentication",
        href: "/",
        icon: "Fingerprint",
        items: [
          { title: "Login", href: "/login" },
          { title: "Register", href: "/register" }
        ]
      },
      {
        title: "Error Pages",
        href: "/",
        icon: "Fingerprint",
        items: [
          { title: "404", href: "/pages/error/404" },
          { title: "500", href: "/pages/error/500" }
        ]
      }
    ]
  }
];
