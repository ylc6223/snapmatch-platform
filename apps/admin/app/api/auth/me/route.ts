import { NextResponse } from "next/server";

import { backendFetch, BackendError } from "@/lib/api/backend";
import {
  clearAdminAccessToken,
  clearAdminRefreshToken,
  getAdminRefreshToken,
  setAdminAccessToken,
  setAdminRefreshToken,
} from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";
import { isApiResponse, makeErrorResponse, type ApiResponse } from "@/lib/api/response";

export const runtime = "nodejs";

function getBackendBaseUrl() {
  return process.env.BACKEND_BASE_URL ?? "http://localhost:3002";
}

async function refreshSession(refreshToken: string) {
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
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    return { ok: false as const, payload };
  }
  const parsed = payload as ApiResponse<{ accessToken: string; refreshToken?: string }>;
  const accessToken = parsed.data?.accessToken;
  if (!accessToken) {
    return { ok: false as const, payload };
  }
  return {
    ok: true as const,
    accessToken,
    refreshToken: parsed.data?.refreshToken ?? null,
  };
}

async function fetchMeWithAccessToken(accessToken: string) {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(new URL("/api/v1/auth/me", backendBaseUrl), {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as unknown;
  return { ok: response.ok, status: response.status, payload };
}

/**
 * BFF：获取当前登录用户（同源）
 *
 * 对接后端：
 * - GET `${BACKEND_BASE_URL}/api/v1/auth/me`
 *
 * 说明：
 * - 该接口用于前端初始化登录态与展示层权限（roles/permissions）
 * - 遇到 401 视为“未登录或 token 失效”，会清理 cookie，避免浏览器长期携带坏 token
 * - 统一错误返回 `{ code, message }`（生产环境默认不返回 detail）
 */
export async function GET() {
  try {
    // backendFetch 默认 auth=true：会从 HttpOnly Cookie 读取 token，并拼 Authorization 转发后端
    const result = await backendFetch<ApiResponse<{ user: AuthUser }>>("/api/v1/auth/me");
    const user = result.data?.user;
    if (!user) {
      return NextResponse.json(makeErrorResponse({ code: 502, message: "Bad Gateway" }), { status: 502 });
    }
    // 透传后端成功 envelope（保持统一结构与 timestamp）
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof BackendError) {
      if (error.status === 401) {
        // 401：优先尝试 refresh（静默续期），失败才清 cookie 并返回 401。
        const refreshToken = await getAdminRefreshToken();
        if (refreshToken) {
          const refreshed = await refreshSession(refreshToken);
          if (refreshed.ok) {
            const me = await fetchMeWithAccessToken(refreshed.accessToken);
            if (me.ok) {
              const result = me.payload as ApiResponse<{ user: AuthUser }>;
              const user = result.data?.user;
              if (!user) {
                return NextResponse.json(makeErrorResponse({ code: 502, message: "Bad Gateway" }), { status: 502 });
              }
              const response = NextResponse.json(result, { status: 200 });
              setAdminAccessToken(response, refreshed.accessToken);
              if (refreshed.refreshToken) {
                setAdminRefreshToken(response, refreshed.refreshToken);
              }
              return response;
            }
          }
        }

        const response = NextResponse.json(
          isApiResponse(error.payload) ? error.payload : makeErrorResponse({ code: 401, message: "未登录" }),
          { status: 401 },
        );
        clearAdminAccessToken(response);
        clearAdminRefreshToken(response);
        return response;
      }
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(makeErrorResponse({ code: error.status, message: "获取用户信息失败" }), {
        status: error.status
      });
    }
    return NextResponse.json(makeErrorResponse({ code: 500, message: "获取用户信息失败" }), { status: 500 });
  }
}
