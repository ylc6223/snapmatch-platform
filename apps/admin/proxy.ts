import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";

function redirectToLogin(request: NextRequest) {
  const url = new URL("/login", request.url);
  const nextPath = request.nextUrl.pathname + request.nextUrl.search;
  url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url);
}

/**
 * Next.js 16：使用 `proxy.ts` 替代 `middleware.ts`（两者不能同时存在）。
 *
 * 用途：
 * - `/` → `/dashboard`（默认落地页）
 * - `/dashboard/*`：轻量路由保护（仅检查 HttpOnly Cookie 是否存在）
 *
 * 注意：
 * - 这里只做“是否已登录”的快速拦截；token 是否有效由后端 /auth/me 与 RBAC Guard 兜底
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
    if (!token) return redirectToLogin(request);
  }
}

export const config = {
  matcher: ["/", "/dashboard/:path*"]
};
