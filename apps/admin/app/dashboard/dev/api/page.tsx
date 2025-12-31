import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ApiDebugger } from "./api-debugger";

import type { ApiResponse } from "@/lib/api/response";
import { getAdminAccessToken } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";
import { withAdminBasePath } from "@/lib/routing/base-path";

export default async function Page() {
  const requestHeaders = await Promise.resolve(headers());
  const accessToken = requestHeaders.get("x-admin-access-token") ?? (await getAdminAccessToken());
  if (!accessToken) redirect(withAdminBasePath("/login?next=/dashboard/dev/api"));

  const response = await fetch(
    new URL("/api/v1/auth/me", process.env.BACKEND_BASE_URL ?? "http://localhost:3002"),
    {
      method: "GET",
      headers: { accept: "application/json", authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    }
  );

  if (response.status === 401)
    redirect(withAdminBasePath("/session-expired?next=/dashboard/dev/api"));
  const result = (await response.json()) as ApiResponse<{ user: AuthUser }>;
  const user = result.data?.user;
  const isAdmin = Boolean(user?.roles?.includes("admin"));
  if (!isAdmin) redirect(withAdminBasePath("/dashboard"));

  return <ApiDebugger />;
}
