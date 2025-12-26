import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthSessionsService } from "../sessions/auth-sessions.service";
import type { AuthUser, JwtPayload } from "../types";

// JWT Strategy：负责从 Authorization Header 解析 Token，并将 payload 映射为 request.user。
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly sessions: AuthSessionsService) {
    super({
      // Bearer Token：Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET") ?? "change-me",
    });
  }

  // validate 的返回值会被挂到 request.user 上，供后续 Guard/Controller 使用。
  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.sid) {
      const active = await this.sessions.isSessionActive(payload.sid);
      if (!active) {
        throw new UnauthorizedException({ code: 40100, message: "会话已失效" });
      }
    }
    return {
      id: payload.sub,
      account: payload.account,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  }
}
