import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Permissions } from "./decorators/permissions.decorator";
import { Roles } from "./decorators/roles.decorator";
import { Role } from "./types";
import { ApiOkEnvelope } from "../common/swagger/api-response.decorators";
import { SecureOkDto } from "./dto/secure-response.dto";

// 示例接口：用于验证 JWT / Roles / Permissions 三类 Guard 的效果。
@ApiTags("secure")
@ApiBearerAuth()
@Controller("secure")
export class SecureController {
  // 仅管理员可访问（RolesGuard；admin 角色兜底放行）。
  @Roles(Role.Admin)
  @ApiOperation({ summary: "仅管理员可访问（示例）" })
  @ApiOkEnvelope(SecureOkDto)
  @Get("admin-only")
  adminOnly() {
    return { ok: true, scope: "admin" };
  }

  // 仅摄影师可访问（RolesGuard）。
  @Roles(Role.Photographer)
  @ApiOperation({ summary: "仅摄影师可访问（示例）" })
  @ApiOkEnvelope(SecureOkDto)
  @Get("photographer-only")
  photographerOnly() {
    return { ok: true, scope: "photographer" };
  }

  // 需要指定权限（PermissionsGuard；permissions 包含 "*" 兜底放行）。
  @Permissions("packages:write")
  @ApiOperation({ summary: "需要指定权限（示例）" })
  @ApiOkEnvelope(SecureOkDto)
  @Get("needs-permission")
  needsPermission() {
    return { ok: true, permission: "packages:write" };
  }
}
