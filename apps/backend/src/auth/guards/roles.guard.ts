import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { Role, type AuthUser } from "../types";

// 角色 Guard：读取 @Roles(...) 元数据并与 request.user.roles 做匹配。
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    // 公开接口无需做角色校验（也避免被全局 Guard 阻断）。
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const userRoles = request.user?.roles ?? [];
    // 管理员角色兜底：避免重复为 admin 配置所有角色/权限点。
    if (userRoles.includes(Role.Admin)) return true;
    return requiredRoles.some((r) => userRoles.includes(r));
  }
}
