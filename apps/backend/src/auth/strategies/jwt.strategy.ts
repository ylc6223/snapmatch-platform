import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AuthUser, JwtPayload } from "../types";

// JWT Strategy：负责从 Authorization Header 解析 Token，并将 payload 映射为 request.user。
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      // Bearer Token：Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET") ?? "change-me",
    });
  }

  // validate 的返回值会被挂到 request.user 上，供后续 Guard/Controller 使用。
  validate(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      account: payload.account,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  }
}
