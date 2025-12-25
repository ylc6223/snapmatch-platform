import { SetMetadata } from "@nestjs/common";

// 声明访问该接口所需权限点列表（由 PermissionsGuard 读取并执行校验）。
export const PERMISSIONS_KEY = "permissions";
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
