/**
 * Layout认证工具
 * 从dashboard/layout.tsx提取的认证逻辑，可复用于其他layout
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAccessToken } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";
import type { ApiResponse } from "@/lib/api/response";
import { withAdminBasePath } from "@/lib/routing/base-path";

/**
 * 认证并获取当前用户信息
 * @returns 用户信息
 * @throws 认证失败会重定向到登录页
 */
export async function authenticateUser(): Promise<AuthUser> {
  try {
    const requestHeaders = await Promise.resolve(headers());
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
    if (!host) throw new Error("Missing request host");

    const accessToken =
      requestHeaders.get("x-admin-access-token") ?? (await getAdminAccessToken());
    if (!accessToken) {
      redirect(withAdminBasePath("/login?next=/dashboard/portfolio/works"));
    }

    const backendBaseUrl = process.env.BACKEND_BASE_URL;
    if (!backendBaseUrl) {
      throw new Error(
        "Missing environment variable: BACKEND_BASE_URL. " +
        "Please set it in .env.local (see .env.example for reference)"
      );
    }

    const response = await fetch(
      new URL("/api/v1/auth/me", backendBaseUrl),
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (response.status === 401) {
      redirect(withAdminBasePath("/session-expired?next=/dashboard/portfolio/works"));
    }
    if (response.status === 403) {
      redirect(withAdminBasePath("/forbidden?next=/dashboard/portfolio/works"));
    }

    const result = (await response.json()) as ApiResponse<{ user: AuthUser }>;
    const user = result.data?.user;
    if (!user) {
      throw new Error("Invalid /api/v1/auth/me response: missing user");
    }

    return user;
  } catch (error) {
    // 如果是重定向错误，直接抛出
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Portfolio模块的导航数据
 */
export interface PortfolioNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

/**
 * 获取Portfolio模块的导航菜单
 */
export function getPortfolioNavItems(): PortfolioNavItem[] {
  return [
    {
      href: "/dashboard/portfolio/works",
      label: "作品列表",
      icon: null, // Icon会在组件中定义
      active: false,
    },
    {
      href: "/dashboard/portfolio/categories",
      label: "分类管理",
      icon: null,
      active: false,
    },
    {
      href: "/dashboard/portfolio/banners",
      label: "轮播图配置",
      icon: null,
      active: false,
    },
  ];
}
