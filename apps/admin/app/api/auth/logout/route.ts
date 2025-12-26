import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { clearAdminAccessToken, clearAdminRefreshToken, getAdminRefreshToken } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * BFF：退出登录（同源）
 *
 * 只做一件事：清理 HttpOnly Cookie（admin_access_token）。
 * 前端收到 204 后跳转到 /login。
 */
export async function POST() {
  const refreshToken = await getAdminRefreshToken();
  if (refreshToken) {
    await backendFetch("/auth/logout", {
      method: "POST",
      auth: false,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  }
  const response = new NextResponse(null, { status: 204 });
  clearAdminAccessToken(response);
  clearAdminRefreshToken(response);
  return response;
}
