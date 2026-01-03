"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { LayoutGrid, Image, FolderOpen, Settings, Moon, Sun, User } from 'lucide-react';
import type { AuthUser } from '@/lib/auth/types';
import { useThemeTransition } from '@/components/ui/theme-toggle-button';

interface SidebarProps {
  user?: AuthUser; // 可选的用户信息
}

/**
 * Portfolio模块的导航配置
 */
const PORTFOLIO_NAV_ITEMS = [
  {
    href: '/dashboard/portfolio/works',
    label: '作品列表',
    icon: <Image size={20} />,
  },
  {
    href: '/dashboard/portfolio/categories',
    label: '分类管理',
    icon: <FolderOpen size={20} />,
  },
  {
    href: '/dashboard/portfolio/banners',
    label: '轮播图配置',
    icon: <LayoutGrid size={20} />,
  },
] as const;

/**
 * Sidebar - Portfolio模块左侧浮动导航栏
 * 特点：垂直布局、图标导航、tooltip提示、使用next-themes管理主题
 */
export const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { startTransition } = useThemeTransition();
  const currentTheme = resolvedTheme === "dark" ? "dark" : "light";

  // 判断当前路由是否激活
  const isActive = (href: string) => {
    if (href === '/dashboard/portfolio/works') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  // 主题切换函数
  const handleThemeToggle = () => {
    startTransition(() => {
      setTheme(currentTheme === "dark" ? "light" : "dark");
    });
  };

  return (
    <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-6 py-6 px-2 rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-2xl shadow-black/5 dark:shadow-black/20 transition-all duration-500">

      {/* Logo / 品牌 */}
      <Link
        href="/dashboard"
        className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary/90 transition-colors"
      >
         <LayoutGrid className="text-primary-foreground w-5 h-5" />
      </Link>

      <div className="w-6 h-px bg-border" />

      {/* 导航项 - Portfolio模块子路由 */}
      <div className="flex flex-col gap-4">
        {PORTFOLIO_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
          >
            <NavItem
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
            />
          </Link>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-border w-full flex flex-col items-center gap-4">
         {/* 主题切换按钮 - 复用admin的主题切换逻辑 */}
         <button
            onClick={handleThemeToggle}
            className="text-muted-foreground hover:text-foreground transition-colors hover:rotate-12 transform duration-300"
            title={currentTheme === "dark" ? "切换亮色模式" : "切换暗色模式"}
         >
            {currentTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
         </button>

         {/* 设置按钮 */}
         <Link href="/dashboard/settings/accounts">
           <button
             className="text-muted-foreground hover:text-foreground transition-colors"
             title="设置"
           >
             <Settings size={20} />
           </button>
         </Link>

         {/* 用户头像（如果有） */}
         {user && (
           <Link href="/dashboard/settings/accounts" className="relative">
             <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors">
               {user.avatar ? (
                 <img src={user.avatar} alt={user.name || '用户'} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                   <User size={18} className="text-primary" />
                 </div>
               )}
             </div>
           </Link>
         )}
      </div>
    </nav>
  );
};

/** 导航项子组件 */
const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <button
    className={`group relative p-2.5 rounded-xl transition-all duration-300 ${
      active
        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    }`}
  >
    {icon}

    {/* Tooltip */}
    <span className="absolute left-full ml-3 px-2.5 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-md">
      {label}
    </span>
  </button>
);
