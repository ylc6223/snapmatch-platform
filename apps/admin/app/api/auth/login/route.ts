import { NextResponse } from "next/server";
import { z } from "zod";

import { backendFetch, BackendError } from "@/lib/api/backend";
import { setAdminAccessToken } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";
import { isApiResponse, makeErrorResponse, type ApiResponse } from "@/lib/api/response";

/**
 * BFF：登录接口（同源）
 *
 * 为什么要放在 apps/admin 的 Route Handler？
 * - 浏览器只访问同源 `/api/*`，不直接访问后端（避免 CORS / token 处理分散）
 * - accessToken 存在 HttpOnly Cookie，前端 JS 不可读；只能由服务端写入
 * - 统一把错误收敛成 `{ code, message }` 供前端展示/跳转策略使用
 *
 * 对接后端：
 * - POST `${BACKEND_BASE_URL}/auth/login`
 * - 成功返回：{ accessToken, user }
 */
const LoginSchema = z.object({
  account: z.string().min(1),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  // 1) 读取并校验请求体（防御：非 JSON、空字符串等）
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(makeErrorResponse({ code: 400, message: "Bad Request" }), { status: 400 });
  }

  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json(makeErrorResponse({ code: 400, message: "Bad Request" }), { status: 400 });
  }

  try {
    // 2) 调用后端登录（这里 auth:false，因为此时还没有 token）
    const result = await backendFetch<ApiResponse<{ accessToken: string; user: AuthUser }>>("/auth/login", {
      method: "POST",
      auth: false,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(parsed.data)
    });

    // 3) 后端成功响应形态：{ code:200, message:'success', data:{accessToken,user}, timestamp }
    const accessToken = result.data?.accessToken;
    const user = result.data?.user;
    if (!accessToken || !user) {
      return NextResponse.json(makeErrorResponse({ code: 502, message: "Bad Gateway" }), { status: 502 });
    }

    // 4) 写入 HttpOnly Cookie（浏览器 JS 不可读），用于后续 /api/auth/me 与业务 /api/* 转发
    setAdminAccessToken(accessToken);
    return NextResponse.json(
      {
        code: 200,
        message: "success",
        data: { user },
        timestamp: Date.now(),
      } satisfies ApiResponse<{ user: AuthUser }>,
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof BackendError) {
      // 5) 错误处理：BFF 仅透传后端标准响应（{code,message,errors,timestamp}），不再重复包一层
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(makeErrorResponse({ code: error.status, message: "登录失败" }), {
        status: error.status
      });
    }
    return NextResponse.json(makeErrorResponse({ code: 500, message: "登录失败" }), {
      status: 500
    });
  }
}
