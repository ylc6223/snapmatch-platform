import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  clearAdminAccessToken,
  clearAdminRefreshToken,
  getAdminAccessToken,
  getAdminRefreshToken,
  setAdminAccessToken,
  setAdminRefreshToken,
} from "@/lib/auth/session";
import { isApiResponse, makeErrorResponse } from "@/lib/api/response";

export const runtime = "nodejs";

function getBackendBaseUrl() {
  const baseUrl = process.env.BACKEND_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "Missing environment variable: BACKEND_BASE_URL. " +
      "Please set it in .env.local (see .env.example for reference)"
    );
  }
  return baseUrl;
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
  const parsed = payload as { data?: { accessToken?: string; refreshToken?: string } };
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

function pickForwardHeaders(requestHeaders: Headers) {
  const headers = new Headers();
  headers.set("accept", requestHeaders.get("accept") ?? "application/json");

  const contentType = requestHeaders.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const ifNoneMatch = requestHeaders.get("if-none-match");
  if (ifNoneMatch) headers.set("if-none-match", ifNoneMatch);

  return headers;
}

async function readBodyBytes(request: NextRequest) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD") return null;
  const bytes = await request.arrayBuffer().catch(() => null);
  return bytes && bytes.byteLength > 0 ? bytes : null;
}

async function proxyToBackend(request: NextRequest, accessToken: string | null, bodyBytes: ArrayBuffer | null) {
  const backendBaseUrl = getBackendBaseUrl();
  const incomingUrl = new URL(request.url);
  const pathname = incomingUrl.pathname;

  // 处理路径转换：
  // - /admin/api/xxx → /api/v1/xxx (去掉 /admin 前缀，添加 /api/v1 前缀)
  // - /api/xxx → /api/v1/xxx (已有 /api 前缀，添加 v1 版本)
  const backendPath = pathname.startsWith("/admin/api/")
    ? `/api/v1${pathname.slice("/admin/api".length)}`
    : pathname.startsWith("/api/")
      ? `/api/v1${pathname.slice("/api".length)}`
      : pathname;
  const backendUrl = new URL(`${backendPath}${incomingUrl.search}`, backendBaseUrl);

  const headers = pickForwardHeaders(request.headers);
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);

  return fetch(backendUrl, {
    method: request.method,
    headers,
    body: bodyBytes ? Buffer.from(bodyBytes) : undefined,
    cache: "no-store",
  });
}

async function toNextResponse(backendResponse: Response) {
  const contentType = backendResponse.headers.get("content-type") ?? "";
  const status = backendResponse.status;

  if (contentType.includes("application/json")) {
    const payload = (await backendResponse.json().catch(() => null)) as unknown;
    if (payload !== null) return NextResponse.json(payload, { status });
  }

  const bytes = await backendResponse.arrayBuffer().catch(() => null);
  const response = new NextResponse(bytes ?? null, { status });
  if (contentType) response.headers.set("content-type", contentType);
  return response;
}

async function handle(request: NextRequest) {
  const bodyBytes = await readBodyBytes(request);
  const accessToken = await getAdminAccessToken();

  try {
    const backendResponse = await proxyToBackend(request, accessToken, bodyBytes);
    if (backendResponse.status !== 401) {
      return await toNextResponse(backendResponse);
    }

    // 401：尝试 refresh 后重试一次；失败则清 cookie 并透传 401。
    const refreshToken = await getAdminRefreshToken();
    if (!refreshToken) {
      const response = await toNextResponse(backendResponse);
      clearAdminAccessToken(response);
      clearAdminRefreshToken(response);
      return response;
    }

    const refreshed = await refreshSession(refreshToken);
    if (!refreshed.ok) {
      const response = NextResponse.json(
        isApiResponse(refreshed.payload) ? refreshed.payload : makeErrorResponse({ code: 401, message: "未登录" }),
        { status: 401 },
      );
      clearAdminAccessToken(response);
      clearAdminRefreshToken(response);
      return response;
    }

    const retried = await proxyToBackend(request, refreshed.accessToken, bodyBytes);
    const response = await toNextResponse(retried);
    setAdminAccessToken(response, refreshed.accessToken);
    if (refreshed.refreshToken) setAdminRefreshToken(response, refreshed.refreshToken);
    if (retried.status === 401) {
      clearAdminAccessToken(response);
      clearAdminRefreshToken(response);
    }
    return response;
  } catch (error) {
    const reason =
      error instanceof Error && error.message.trim().length > 0 ? error.message.trim() : "unknown error";
    return NextResponse.json(
      makeErrorResponse({
        code: 502,
        message: "Bad Gateway",
        errors: process.env.NODE_ENV === "production" ? undefined : [{ field: "backend", reason }],
      }),
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function PUT(request: NextRequest) {
  return handle(request);
}

export async function PATCH(request: NextRequest) {
  return handle(request);
}

export async function DELETE(request: NextRequest) {
  return handle(request);
}

export async function OPTIONS(request: NextRequest) {
  return handle(request);
}
