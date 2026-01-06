import "server-only";

import type { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { ADMIN_REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getAdminCookieSecure } from "@/lib/auth/cookie-secure";

/**
 * Admin 登录态 Cookie（仅服务端）
 *
 * 说明：
 * - 读取：使用 `next/headers` 的 `cookies()`（适用于 Route Handler / Server Component）
 * - 写入/清理：使用 `NextResponse.cookies.set(...)`（在 Route Handler 中最稳定）
 *
 * 背景：在 Next.js 16（尤其是 Turbopack）下，`cookies()` 在部分场景可能是只读的，
 * 直接 `cookies().set(...)` 会报错，因此这里统一通过 response 写入。
 */
export function getAdminAccessToken() {
  // Next.js 16（async request APIs）下，`cookies()` 可能返回 Promise，因此这里统一做一次 Promise.resolve。
  // 这样无论是同步还是异步实现，都能拿到稳定的 cookieStore 接口。
  return Promise.resolve(cookies()).then(
    (cookieStore) => cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value ?? null,
  );
}

export function getAdminRefreshToken() {
  return Promise.resolve(cookies()).then(
    (cookieStore) => cookieStore.get(ADMIN_REFRESH_TOKEN_COOKIE)?.value ?? null,
  );
}

function getAdminAccessTokenCookieOptions(value: string) {
  // 统一 cookie 属性，避免不同接口写入不一致导致登录态异常。
  return {
    name: ADMIN_ACCESS_TOKEN_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: getAdminCookieSecure(),
    path: "/"
  } as const;
}

function getAdminRefreshTokenCookieOptions(value: string) {
  return {
    name: ADMIN_REFRESH_TOKEN_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: getAdminCookieSecure(),
    path: "/",
  } as const;
}

export function setAdminAccessToken(response: NextResponse, accessToken: string) {
  response.cookies.set(getAdminAccessTokenCookieOptions(accessToken));
}

export function setAdminRefreshToken(response: NextResponse, refreshToken: string) {
  response.cookies.set(getAdminRefreshTokenCookieOptions(refreshToken));
}

export function clearAdminAccessToken(response: NextResponse) {
  response.cookies.set({
    ...getAdminAccessTokenCookieOptions(""),
    maxAge: 0,
  });
}

export function clearAdminRefreshToken(response: NextResponse) {
  response.cookies.set({
    ...getAdminRefreshTokenCookieOptions(""),
    maxAge: 0,
  });
}
