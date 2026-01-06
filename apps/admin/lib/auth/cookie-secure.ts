import "server-only";

function parseBoolean(value: string | undefined): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return null;
}

/**
 * 决定 Admin 登录态 Cookie 是否设置 `Secure`。
 *
 * 优先级：
 * 1) 显式配置 `ADMIN_COOKIE_SECURE`（true/false）
 * 2) 回退到 `NODE_ENV === "production"`
 */
export function getAdminCookieSecure(): boolean {
  const explicit = parseBoolean(process.env.ADMIN_COOKIE_SECURE);
  if (explicit !== null) return explicit;
  return process.env.NODE_ENV === "production";
}

