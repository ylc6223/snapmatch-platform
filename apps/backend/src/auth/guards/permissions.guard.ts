import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type { AuthUser } from "../types";

// 权限 Guard：读取 @Permissions(...) 元数据并与 request.user.permissions 做匹配。
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    // 公开接口无需做权限校验（也避免被全局 Guard 阻断）。
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const userPermissions = request.user?.permissions ?? [];
    // "*" 表示超级权限，拥有全部权限点。
    if (userPermissions.includes("*")) return true;
    return required.every((p) => userPermissions.includes(p));
  }
}
