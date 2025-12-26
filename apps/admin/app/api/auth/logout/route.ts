import { NextResponse } from "next/server";

import { clearAdminAccessToken } from "@/lib/auth/session";

/**
 * BFF：退出登录（同源）
 *
 * 只做一件事：清理 HttpOnly Cookie（admin_access_token）。
 * 前端收到 204 后跳转到 /login。
 */
export async function POST() {
  clearAdminAccessToken();
  return new NextResponse(null, { status: 204 });
}
