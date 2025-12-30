function normalizeBasePath(input: string | undefined) {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  if (raw === "/") return "";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

export const ADMIN_BASE_PATH =
  normalizeBasePath(process.env.NEXT_PUBLIC_ADMIN_BASE_PATH) || "/admin";

export function withAdminBasePath(path: string) {
  if (!path.startsWith("/")) return `${ADMIN_BASE_PATH}/${path}`;
  return `${ADMIN_BASE_PATH}${path}`;
}
