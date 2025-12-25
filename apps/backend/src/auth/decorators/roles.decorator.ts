import { SetMetadata } from "@nestjs/common";
import type { Role } from "../types";

// 声明访问该接口所需角色列表（由 RolesGuard 读取并执行校验）。
export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
