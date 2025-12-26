import { Body, Controller, Get, Post, UnauthorizedException, Req } from "@nestjs/common";
import type { Request } from "express";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { LogoutDto } from "./dto/logout.dto";
import type { AuthUser } from "./types";
import { AUTH_ERROR_CODE } from "./error-codes";

// 鉴权入口控制器：提供登录与获取当前用户信息等能力。
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 登录接口（公开）：校验账号+密码，签发 JWT（accessToken）。
  @Public()
  @Post("login")
  async login(@Body() dto: LoginDto, @Req() request: Request) {
    const ip = request.ip ?? null;
    const userAgent = request.headers["user-agent"] ?? null;
    const result = await this.authService.login(dto.account, dto.password, { ip, userAgent });
    if (!result) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODE.InvalidCredentials,
        message: "账号或密码错误",
      });
    }
    return result;
  }

  // refresh：用于短期 accessToken 过期后的续期（会旋转 refresh token，支持服务端登出/踢下线）。
  @Public()
  @Post("refresh")
  async refresh(@Body() dto: RefreshDto) {
    const result = await this.authService.refresh(dto.refreshToken);
    if (!result) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODE.Unauthorized,
        message: "refresh token 无效或已过期",
      });
    }
    return result;
  }

  // 登出：撤销 refresh token 对应的会话；由于 accessToken 绑定 sid，撤销后会立即失效。
  @Public()
  @Post("logout")
  async logout(@Body() dto: LogoutDto) {
    await this.authService.logoutByRefreshToken(dto.refreshToken);
    return null;
  }

  // 获取当前用户（需要 JWT）：返回 JwtStrategy 注入的 request.user。
  @Get("me")
  me(@CurrentUser() user: AuthUser | undefined) {
    if (!user) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODE.Unauthorized,
        message: "未登录",
      });
    }
    return { user };
  }
}
