import { IsString, MaxLength, MinLength, Matches } from "class-validator";

// 登录请求 DTO：配合全局 ValidationPipe 进行参数校验与拦截非法请求。
export class LoginDto {
  // 账号：与 apps/admin 登录页语义一致（不强制邮箱格式）。
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9._-]+$/, { message: "account contains invalid characters" })
  account!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
