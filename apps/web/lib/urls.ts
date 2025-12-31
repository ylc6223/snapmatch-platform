export function joinUrl(base: string, path: string) {
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

const defaultAdminBaseUrl =
  process.env.NODE_ENV === "development" ? "http://localhost:3001/admin" : "/admin"

const adminBaseUrl =
  process.env.NEXT_PUBLIC_ADMIN_BASE_URL?.trim() || defaultAdminBaseUrl

export const ADMIN_LOGIN_URL = joinUrl(adminBaseUrl, "/login")
export const ADMIN_DASHBOARD_URL = joinUrl(adminBaseUrl, "/dashboard")
