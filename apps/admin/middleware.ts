import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_ACCESS_TOKEN_COOKIE = "admin_access_token";

function normalizeBasePath(input: string | undefined) {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  if (raw === "/") return "";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

const ADMIN_BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_ADMIN_BASE_PATH) || "/admin";

function stripBasePath(pathname: string) {
  if (!ADMIN_BASE_PATH) return pathname;
  if (!pathname.startsWith(ADMIN_BASE_PATH)) return pathname;
  const stripped = pathname.slice(ADMIN_BASE_PATH.length);
  return stripped.length > 0 ? stripped : "/";
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathWithoutBasePath = stripBasePath(pathname);

  if (!pathWithoutBasePath.startsWith("/dashboard")) return NextResponse.next();

  const accessToken = request.cookies.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value ?? null;
  if (accessToken) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = `${ADMIN_BASE_PATH}/login`;
  loginUrl.searchParams.set("next", `${pathWithoutBasePath}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/:path*"],
};

