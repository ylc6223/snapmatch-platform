import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";
import type { AuthUser, JwtPayload } from "./types";

// 鉴权核心服务：负责校验账号密码并签发 JWT。
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // 返回 null 表示认证失败；成功则返回 accessToken 与用户信息（用于前端缓存/展示）。
  async login(account: string, password: string) {
    const user = await this.usersService.findByAccount(account);
    if (!user) return null;

    // 使用 bcrypt 校验密码（与 apps/backend/src/scripts/hash-password.ts 生成的 hash 匹配）。
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;

    // JWT payload：sub 为用户唯一标识，其余用于 RBAC（角色/权限）判定。
    const payload: JwtPayload = {
      sub: user.id,
      account: user.account,
      roles: user.roles,
      permissions: user.permissions,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const authUser: AuthUser = {
      id: user.id,
      account: user.account,
      roles: user.roles,
      permissions: user.permissions,
    };

    return { accessToken, user: authUser };
  }
}
