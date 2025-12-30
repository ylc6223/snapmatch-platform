import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_ACCESS_TOKEN_COOKIE, ADMIN_REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { withAdminBasePath } from "@/lib/routing/base-path";

function redirectToLogin(request: NextRequest) {
  const url = new URL(withAdminBasePath("/login"), request.url);
  const nextPath = request.nextUrl.pathname + request.nextUrl.search;
  url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url);
}

function redirectToSessionExpired(
  request: NextRequest,
  detail?: { message?: string },
) {
  const url = new URL(withAdminBasePath("/session-expired"), request.url);
  const nextPath = request.nextUrl.pathname + request.nextUrl.search;
  url.searchParams.set("next", nextPath);
  const message = detail?.message?.trim();
  if (message && message.length > 0) url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

function clearAuthCookies(response: NextResponse) {
  const common = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  response.cookies.set({ name: ADMIN_ACCESS_TOKEN_COOKIE, value: "", maxAge: 0, ...common });
  response.cookies.set({ name: ADMIN_REFRESH_TOKEN_COOKIE, value: "", maxAge: 0, ...common });
}

function setAuthCookies(
  response: NextResponse,
  input: { accessToken: string; refreshToken?: string | null }
) {
  const common = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  response.cookies.set({ name: ADMIN_ACCESS_TOKEN_COOKIE, value: input.accessToken, ...common });
  if (input.refreshToken) {
    response.cookies.set({ name: ADMIN_REFRESH_TOKEN_COOKIE, value: input.refreshToken, ...common });
  }
}

function getBackendBaseUrl() {
  return process.env.BACKEND_BASE_URL ?? "http://localhost:3002";
}

async function backendMe(accessToken: string) {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(new URL("/api/v1/auth/me", backendBaseUrl), {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  return response.status;
}

async function backendRefresh(refreshToken: string) {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(new URL("/api/v1/auth/refresh", backendBaseUrl), {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: { accessToken?: string; refreshToken?: string } }
    | null;
  const accessToken = payload?.data?.accessToken;
  if (!response.ok || !accessToken) return null;
  return { accessToken, refreshToken: payload?.data?.refreshToken ?? null };
}

/**
 * Next.js 16：使用 `proxy.ts` 替代 `middleware.ts`（两者不能同时存在）。
 *
 * 用途：
 * - `/` → `/dashboard`（默认落地页）
 * - `/dashboard/*`：轻量路由保护（仅检查 HttpOnly Cookie 是否存在）
 *
 * 注意：
 * - 这里只做“是否已登录”的快速拦截；token 是否有效由后端 /api/v1/auth/me 与 RBAC Guard 兜底
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
    if (!token) return redirectToLogin(request);

    // SSR 场景的静默续期必须在这里做：
    // - 如果在服务端请求 /api/auth/me 才 refresh，会产生 Set-Cookie，但不会回写到浏览器（不会“落盘”）。
    // - refresh token 又会旋转，浏览器仍持有旧 refresh token，下一次请求就会失败并被迫回登录页。
    //
    // 因此：proxy 层直接调用后端 /api/v1/auth/me 校验 token；401 时用 refresh token 续期并：
    // 1) 在响应写回 cookie（让浏览器拿到新的 access/refresh token）
    // 2) 在请求头注入 x-admin-access-token（让同一次 SSR 渲染能用新 token 访问后端）
    try {
      const status = await backendMe(token);
      if (status !== 401) return;

    const refreshToken = request.cookies.get(ADMIN_REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshToken) {
      const redirect = redirectToSessionExpired(request, { message: "缺少续期凭证，请重新登录。" });
      clearAuthCookies(redirect);
      return redirect;
    }

    const refreshed = await backendRefresh(refreshToken);
    if (!refreshed) {
      const redirect = redirectToSessionExpired(request, { message: "登录已失效或已被踢下线，请重新登录。" });
      clearAuthCookies(redirect);
      return redirect;
    }

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-admin-access-token", refreshed.accessToken);
      const next = NextResponse.next({ request: { headers: requestHeaders } });
      setAuthCookies(next, refreshed);
      return next;
    } catch {
      // 网络错误/异常：保持放行，由页面内 /api/v1/auth/me 与业务接口兜底（避免误踢用户）。
      return;
    }
  }
}

export const config = {
  matcher: ["/", "/dashboard/:path*"]
};
