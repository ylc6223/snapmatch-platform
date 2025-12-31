import { Body, Controller, Get, Post, UnauthorizedException, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import type { Request } from "express";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { LogoutDto } from "./dto/logout.dto";
import type { AuthUser } from "./types";
import { AUTH_ERROR_CODE } from "./error-codes";
import { ApiOkEnvelope, ApiOkEnvelopeNullable } from "../common/swagger/api-response.decorators";
import { AuthLoginDataDto } from "./dto/auth-login-response.dto";
import { AuthRefreshDataDto } from "./dto/auth-refresh-response.dto";
import { AuthMeDataDto } from "./dto/auth-me-response.dto";
import { EmptyDto } from "../common/swagger/api-response.dto";

// 鉴权入口控制器：提供登录与获取当前用户信息等能力。
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 登录接口（公开）：校验账号+密码，签发 JWT（accessToken）。
  @Public()
  @ApiOperation({ summary: "员工登录", description: "账号密码登录，成功返回 access/refresh token 与用户信息。" })
  @ApiBody({
    type: LoginDto,
    examples: {
      admin: {
        summary: "种子账号：admin",
        value: { account: "admin", password: "admin" },
      },
      photographer: {
        summary: "种子账号：photographer（默认同 admin 密码）",
        value: { account: "photographer", password: "admin" },
      },
      sales: {
        summary: "种子账号：sales（默认同 admin 密码）",
        value: { account: "sales", password: "admin" },
      },
    },
  })
  @ApiOkEnvelope(AuthLoginDataDto)
  @ApiUnauthorizedResponse({ description: "账号或密码错误" })
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
  @ApiOperation({ summary: "续期 accessToken", description: "使用 refreshToken 换取新的 accessToken（会旋转 refreshToken）。" })
  @ApiBody({
    type: RefreshDto,
    examples: {
      example: {
        summary: "示例（请替换为真实 refreshToken）",
        value: { refreshToken: "rt_example_please_replace" },
      },
    },
  })
  @ApiOkEnvelope(AuthRefreshDataDto)
  @ApiUnauthorizedResponse({ description: "refresh token 无效或已过期" })
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
  @ApiOperation({ summary: "登出", description: "撤销 refreshToken 对应的会话；成功后该会话立即失效。" })
  @ApiBody({
    type: LogoutDto,
    examples: {
      example: {
        summary: "示例（请替换为真实 refreshToken）",
        value: { refreshToken: "rt_example_please_replace" },
      },
    },
  })
  @ApiOkEnvelopeNullable(EmptyDto)
  @Post("logout")
  async logout(@Body() dto: LogoutDto) {
    await this.authService.logoutByRefreshToken(dto.refreshToken);
    return null;
  }

  // 获取当前用户（需要 JWT）：返回 JwtStrategy 注入的 request.user。
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取当前用户", description: "需要 Bearer accessToken，返回当前用户的 roles/permissions。" })
  @ApiOkEnvelope(AuthMeDataDto)
  @ApiUnauthorizedResponse({ description: "未登录" })
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
