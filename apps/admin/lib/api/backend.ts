import "server-only";

import { getAdminAccessToken } from "@/lib/auth/session";
import { makeErrorResponse } from "@/lib/api/response";

/**
 * 后端请求封装（仅服务端使用）
 *
 * 设计目标：
 * - apps/admin 只请求同源 `/api/*`（BFF），由 BFF 统一转发到 apps/backend
 * - accessToken 只存 HttpOnly Cookie，浏览器 JS 不可读；由服务端读取并拼 Authorization
 * - 统一把“后端不可达”等网络层错误转成标准 envelope，便于前端展示与排查
 */
export class BackendError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super(`BackendError: ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

function getBackendBaseUrl() {
  // 仅服务端读取，不要使用 NEXT_PUBLIC_ 前缀以免泄露给浏览器。
  return process.env.BACKEND_BASE_URL ?? "http://localhost:3002";
}

async function readResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  try {
    return await response.text();
  } catch {
    return null;
  }
}

export async function backendFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const backendBaseUrl = getBackendBaseUrl();
  const url = new URL(path, backendBaseUrl);

  const requestHeaders = new Headers(headers);
  requestHeaders.set("accept", "application/json");

  if (auth) {
    // 需要登录态的请求：从 HttpOnly Cookie 读取 accessToken 并转成 Authorization Header。
    const accessToken = await getAdminAccessToken();
    if (!accessToken) {
      throw new BackendError(401, { message: "缺少登录凭证" });
    }
    requestHeaders.set("authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      cache: "no-store"
    });
  } catch (error) {
    // 网络层错误（例如后端未启动/端口不通）：统一映射为 502，避免前端看到难理解的异常堆栈。
    const detail =
      error instanceof Error && error.message.trim().length > 0 ? error.message.trim() : "unknown error";
    throw new BackendError(
      502,
      makeErrorResponse({
        code: 502,
        message: "Bad Gateway",
        errors: [{ field: "backend", reason: `failed to fetch ${url.toString()} (${detail})` }],
      }),
    );
  }

  const payload = await readResponsePayload(response);
  if (!response.ok) {
    throw new BackendError(response.status, payload);
  }
  return payload as T;
}
