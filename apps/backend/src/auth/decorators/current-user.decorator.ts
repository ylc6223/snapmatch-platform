import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthUser } from "../types";

// 从 request.user 读取当前登录用户（由 JwtStrategy 注入）。
export const CurrentUser = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
  return request.user;
});
