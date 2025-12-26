import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";
import { AuthSessionsService } from "./sessions/auth-sessions.service";
import type { AuthUser, JwtPayload } from "./types";

// 鉴权核心服务：负责校验账号密码并签发 JWT。
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly sessions: AuthSessionsService,
  ) {}

  // 返回 null 表示认证失败；成功则返回 accessToken 与用户信息（用于前端缓存/展示）。
  async login(account: string, password: string, meta?: { ip?: string | null; userAgent?: string | null }) {
    const debugAuth = (this.config.get<string>("AUTH_DEBUG") ?? "").toLowerCase() === "true";
    const user = await this.usersService.findByAccount(account);
    if (debugAuth) {
      // 不打印密码、hash 等敏感信息；仅用于定位“找不到用户/密码不匹配”之类问题。
      console.log("[auth] login attempt", { account, userFound: Boolean(user) });
    }
    if (!user) return null;

    // 使用 bcrypt 校验密码（与 apps/backend/src/scripts/hash-password.ts 生成的 hash 匹配）。
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (debugAuth) {
      console.log("[auth] password compare", { account: user.account, ok });
    }
    if (!ok) return null;

    const { sessionId, refreshToken, expiresAt } = await this.sessions.createSession({
      userId: user.id,
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null,
    });

    // JWT payload：sub 为用户唯一标识，其余用于 RBAC（角色/权限）判定。
    const payload: JwtPayload = {
      sub: user.id,
      account: user.account,
      roles: user.roles,
      permissions: user.permissions,
      sid: sessionId,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const authUser: AuthUser = {
      id: user.id,
      account: user.account,
      roles: user.roles,
      permissions: user.permissions,
    };

    return { accessToken, refreshToken, refreshExpiresAt: expiresAt.getTime(), user: authUser };
  }

  async refresh(refreshToken: string) {
    const rotated = await this.sessions.rotateByRefreshToken(refreshToken);
    if (!rotated) return null;

    const user = await this.usersService.findById(rotated.userId);
    if (!user) {
      await this.sessions.revokeBySessionId(rotated.sessionId);
      return null;
    }

    const payload: JwtPayload = {
      sub: user.id,
      account: user.account,
      roles: user.roles,
      permissions: user.permissions,
      sid: rotated.sessionId,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      refreshToken: rotated.refreshToken,
      refreshExpiresAt: rotated.expiresAt.getTime(),
    };
  }

  logoutBySessionId(sessionId: string): Promise<void> {
    return this.sessions.revokeBySessionId(sessionId);
  }

  logoutByRefreshToken(refreshToken: string): Promise<boolean> {
    return this.sessions.revokeByRefreshToken(refreshToken);
  }
}
