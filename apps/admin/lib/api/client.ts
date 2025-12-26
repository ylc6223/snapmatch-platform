"use client";

import { emitSessionExpired } from "@/lib/api/session-expired";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(input: { status: number; payload: unknown; message?: string }) {
    super(input.message ?? `ApiError: ${input.status}`);
    this.status = input.status;
    this.payload = input.payload;
  }
}

function getNextPath() {
  if (typeof window === "undefined") return "/dashboard";
  return window.location.pathname + window.location.search;
}

export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, cache: "no-store" });
  const contentType = response.headers.get("content-type") ?? "";

  let payload: unknown = null;
  if (contentType.includes("application/json")) {
    payload = await response.json().catch(() => null);
  } else {
    payload = await response.text().catch(() => null);
  }

  if (response.status === 401) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as { message?: unknown }).message ?? "")
        : "";
    emitSessionExpired({
      message: message.trim().length ? message.trim() : "登录已失效或已被踢下线，请重新登录。",
      nextPath: getNextPath(),
    });
  }

  if (!response.ok) {
    throw new ApiError({ status: response.status, payload });
  }

  return payload as T;
}

