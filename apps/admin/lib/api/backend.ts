import "server-only";

import { getAdminAccessToken } from "@/lib/auth/session";

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
    const accessToken = getAdminAccessToken();
    if (!accessToken) {
      throw new BackendError(401, { message: "缺少登录凭证" });
    }
    requestHeaders.set("authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    cache: "no-store"
  });

  const payload = await readResponsePayload(response);
  if (!response.ok) {
    throw new BackendError(response.status, payload);
  }
  return payload as T;
}

