import type { AuthUser, Role } from "@/lib/auth/types";

/**
 * RBAC（展示层）
 *
 * 注意：
 * - 后端有强校验（Guard），这里仅用于前端菜单/按钮的展示控制
 * - `admin` 视为超级管理员，默认拥有全部权限（permissions 包含 "*"）
 */
type AccessRule = {
  roles?: Role[];
  permissions?: string[];
};

export function isAdmin(user: AuthUser) {
  return user.roles.includes("admin");
}

export function hasPermission(user: AuthUser, permission: string) {
  return user.permissions.includes("*") || user.permissions.includes(permission);
}

export function canAccess(user: AuthUser, rule: AccessRule) {
  // 超级管理员兜底：无视细粒度规则直接放行。
  if (isAdmin(user)) return true;

  if (rule.roles && rule.roles.length > 0) {
    const ok = rule.roles.some((role) => user.roles.includes(role));
    if (!ok) return false;
  }

  if (rule.permissions && rule.permissions.length > 0) {
    const ok = rule.permissions.every((permission) => hasPermission(user, permission));
    if (!ok) return false;
  }

  return true;
}
