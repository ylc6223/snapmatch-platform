import { Transform } from "class-transformer";
import { IsString, MaxLength, MinLength } from "class-validator";

// 登录请求 DTO：配合全局 ValidationPipe 进行参数校验与拦截非法请求。
export class LoginDto {
  // 账号：与 apps/admin 登录页语义一致（不强制邮箱格式）。
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(1)
  @MaxLength(128)
  account!: string;

  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(6)
  @MaxLength(128)
  password!: string;
}
