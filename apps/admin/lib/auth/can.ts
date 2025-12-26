import type { AuthUser, Role } from "@/lib/auth/types";

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

