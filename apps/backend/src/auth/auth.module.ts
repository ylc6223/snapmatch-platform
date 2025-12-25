import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { SecureController } from "./secure.controller";

function parseJwtExpiresInToSeconds(value: string): number {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);

  const match = /^(\d+)(s|m|h|d|w)$/.exec(trimmed);
  if (!match) throw new Error(`Invalid JWT_EXPIRES_IN: ${value}`);

  const amount = Number(match[1]);
  const unit = match[2];
  const secondsPerUnit: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
    w: 60 * 60 * 24 * 7,
  };

  return amount * secondsPerUnit[unit];
}

@Module({
  imports: [
    // 用户模块：AuthService 需要通过 UsersService 查找用户并完成登录校验。
    UsersModule,
    // Passport 基础设施：提供 Guard/Strategy 的运行机制。
    PassportModule,
    // JWT 配置：从环境变量读取密钥与过期时间。
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET") ?? "change-me",
        signOptions: {
          // 使用 seconds（number）避免依赖 ms 的类型；支持 12h/30m/3600s/1d/1w 或纯数字秒。
          expiresIn: parseJwtExpiresInToSeconds(config.get<string>("JWT_EXPIRES_IN") ?? "12h"),
        },
      }),
    }),
  ],
  // AuthController：登录、me 等鉴权相关接口；SecureController：示例受保护接口（演示 RBAC）。
  controllers: [AuthController, SecureController],
  // JwtStrategy：解析 Bearer Token 并将 payload 映射为 request.user。
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
