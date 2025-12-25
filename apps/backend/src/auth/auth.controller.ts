import { Body, Controller, Get, Post, UnauthorizedException } from "@nestjs/common";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import type { AuthUser } from "./types";

// 鉴权入口控制器：提供登录与获取当前用户信息等能力。
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 登录接口（公开）：校验账号+密码，签发 JWT（accessToken）。
  @Public()
  @Post("login")
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.account, dto.password);
    if (!result) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return result;
  }

  // 获取当前用户（需要 JWT）：返回 JwtStrategy 注入的 request.user。
  @Get("me")
  me(@CurrentUser() user: AuthUser | undefined) {
    if (!user) {
      throw new UnauthorizedException();
    }
    return { user };
  }
}
