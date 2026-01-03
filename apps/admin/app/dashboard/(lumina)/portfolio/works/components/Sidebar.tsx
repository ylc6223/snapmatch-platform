"use client";

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Home, LayoutGrid, Image, FolderOpen, Settings, Moon, Sun, User } from 'lucide-react';
import type { AuthUser } from '@/lib/auth/types';
import { useThemeTransition } from '@/components/ui/theme-toggle-button';
import { canAccess } from '@/lib/auth/can';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 从主 dashboard 复制的菜单数据类型
type MenuItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  items?: { title: string; url: string }[];
  permissions?: string[];
  roles?: string[];
};

// 导航菜单配置（与主dashboard保持一致）
const DASHBOARD_NAV_ITEMS: MenuItem[] = [
  {
    title: "工作台",
    url: "/dashboard/analytics",
    icon: LayoutGrid,
    permissions: ["page:dashboard", "dashboard:view"],
    items: [
      { title: "数据概览", url: "/dashboard/analytics" },
      { title: "快捷入口", url: "/dashboard/shortcuts" }
    ]
  },
  {
    title: "作品集管理",
    url: "/dashboard/portfolio",
    icon: Image,
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
    icon: FolderOpen,
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
    icon: User,
    permissions: ["page:packages"],
    items: [
      { title: "客户档案", url: "/dashboard/crm/customers" },
      { title: "订单列表", url: "/dashboard/crm/orders" }
    ]
  },
  {
    title: "系统设置",
    url: "/dashboard/settings/accounts",
    icon: Settings,
    permissions: ["page:settings"],
    items: [
      { title: "账号与权限", url: "/dashboard/settings/accounts" },
      { title: "存储配置", url: "/dashboard/settings/storage" },
      { title: "小程序配置", url: "/dashboard/settings/miniprogram" }
    ]
  }
];

interface SidebarProps {
  user?: AuthUser; // 可选的用户信息
}

/**
 * Sidebar - Portfolio模块左侧浮动导航栏
 * 特点：垂直布局、图标导航、tooltip提示、使用next-themes管理主题
 */
export const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { startTransition } = useThemeTransition();
  const currentTheme = resolvedTheme === "dark" ? "dark" : "light";

  // 根据用户权限过滤菜单
  const navItems = React.useMemo(() => {
    if (!user) return [];
    return DASHBOARD_NAV_ITEMS.filter((item) => canAccess(user, item));
  }, [user]);

  // 判断当前路由是否激活
  const isActive = (href: string) => {
    if (href === '#') return false;
    if (href === '/dashboard/portfolio/works') {
      return pathname === href;
    }
    return pathname?.startsWith(href) || pathname?.startsWith(`${href}/`);
  };

  // 主题切换函数
  const handleThemeToggle = () => {
    startTransition(() => {
      setTheme(currentTheme === "dark" ? "light" : "dark");
    });
  };

  // 子菜单展开状态管理
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>(null);
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  const toggleMenu = (href: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedMenu(prev => (prev === href ? null : href));
  };

  // 点击外部关闭子菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setExpandedMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav ref={sidebarRef} className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-6 py-5 px-1.5 rounded-full bg-card/80 backdrop-blur-xl border border-border shadow-2xl shadow-black/5 dark:shadow-black/20 transition-all duration-500" style={{ width: '3rem' }}>

      {/* Logo / 品牌 - 主页图标 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/dashboard"
            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
             <Home className="w-5 h-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          <p>主页</p>
        </TooltipContent>
      </Tooltip>

      <div className="w-6 h-px bg-border" />

      {/* 导航项 - Dashboard一级菜单（动态权限过滤） */}
      <div className="flex flex-col gap-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavItem
              key={item.url}
              icon={<Icon size={20} />}
              label={item.title}
              href={item.url}
              subItems={item.items}
              active={isActive(item.url)}
              isExpanded={expandedMenu === item.url}
              onToggle={(e) => toggleMenu(item.url, e)}
              isActiveRoute={(href: string) => isActive(href)}
            />
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-border w-full flex flex-col items-center gap-4">
         {/* 主题切换按钮 */}
         <button
            onClick={handleThemeToggle}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all hover:rotate-12 transform duration-300"
            title={currentTheme === "dark" ? "切换亮色模式" : "切换暗色模式"}
         >
            {currentTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
         </button>

         {/* 用户头像（如果有） */}
         {user && (
           <Link href="/dashboard/settings/accounts" className="relative">
             <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors flex items-center justify-center bg-primary/10">
               {user.avatar ? (
                 <img src={user.avatar} alt={user.name || '用户'} className="w-full h-full object-cover" />
               ) : (
                 <User size={18} className="text-primary" />
               )}
             </div>
           </Link>
         )}
      </div>
    </nav>
  );
};

/** 导航项子组件 */
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  subItems?: Array<{ title: string; href: string }>;
  active?: boolean;
  isExpanded?: boolean;
  onToggle?: (e?: React.MouseEvent) => void;
  isActiveRoute?: (href: string) => boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  href,
  subItems,
  active,
  isExpanded = false,
  onToggle,
  isActiveRoute,
}) => {
  const hasSubItems = subItems && subItems.length > 0;

  const handleSubItemClick = () => {
    // 点击子菜单项后关闭弹出层
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={hasSubItems ? onToggle : undefined}
            className={`group relative p-2 rounded-lg transition-all duration-300 ${
              active
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>

      {/* 子菜单弹出层 */}
      {hasSubItems && isExpanded && (
        <div className="absolute left-full top-0 ml-2 min-w-[200px] bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-2xl shadow-black/10 overflow-hidden z-50">
          <div className="p-2">
            {subItems.map((subItem) => {
              const isSubActive = isActiveRoute?.(subItem.href);
              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  onClick={handleSubItemClick}
                  className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                    isSubActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  {subItem.title}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
