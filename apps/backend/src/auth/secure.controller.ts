import { Controller, Get } from "@nestjs/common";
import { Permissions } from "./decorators/permissions.decorator";
import { Roles } from "./decorators/roles.decorator";
import { Role } from "./types";

// 示例接口：用于验证 JWT / Roles / Permissions 三类 Guard 的效果。
@Controller("secure")
export class SecureController {
  // 仅管理员可访问（RolesGuard；admin 角色兜底放行）。
  @Roles(Role.Admin)
  @Get("admin-only")
  adminOnly() {
    return { ok: true, scope: "admin" };
  }

  // 仅摄影师可访问（RolesGuard）。
  @Roles(Role.Photographer)
  @Get("photographer-only")
  photographerOnly() {
    return { ok: true, scope: "photographer" };
  }

  // 需要指定权限（PermissionsGuard；permissions 包含 "*" 兜底放行）。
  @Permissions("packages:write")
  @Get("needs-permission")
  needsPermission() {
    return { ok: true, permission: "packages:write" };
  }
}
