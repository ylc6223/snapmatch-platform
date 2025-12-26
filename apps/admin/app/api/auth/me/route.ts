import { NextResponse } from "next/server";

import { backendFetch, BackendError } from "@/lib/api/backend";
import { clearAdminAccessToken } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";
import { isApiResponse, makeErrorResponse, type ApiResponse } from "@/lib/api/response";

/**
 * BFF：获取当前登录用户（同源）
 *
 * 对接后端：
 * - GET `${BACKEND_BASE_URL}/auth/me`
 *
 * 说明：
 * - 该接口用于前端初始化登录态与展示层权限（roles/permissions）
 * - 遇到 401 视为“未登录或 token 失效”，会清理 cookie，避免浏览器长期携带坏 token
 * - 统一错误返回 `{ code, message }`（生产环境默认不返回 detail）
 */
export async function GET() {
  try {
    // backendFetch 默认 auth=true：会从 HttpOnly Cookie 读取 token，并拼 Authorization 转发后端
    const result = await backendFetch<ApiResponse<{ user: AuthUser }>>("/auth/me");
    const user = result.data?.user;
    if (!user) {
      return NextResponse.json(makeErrorResponse({ code: 502, message: "Bad Gateway" }), { status: 502 });
    }
    // 透传后端成功 envelope（保持统一结构与 timestamp）
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof BackendError) {
      if (error.status === 401) {
        // 401：未登录/过期/无效 → 清 cookie，前端收到 401 后跳转登录
        clearAdminAccessToken();
        if (isApiResponse(error.payload)) {
          return NextResponse.json(error.payload, { status: 401 });
        }
        return NextResponse.json(makeErrorResponse({ code: 401, message: "未登录" }), { status: 401 });
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
