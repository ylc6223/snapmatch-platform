import { Transform } from "class-transformer";
import { IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

// 登录请求 DTO：配合全局 ValidationPipe 进行参数校验与拦截非法请求。
export class LoginDto {
  // 账号：与 apps/admin 登录页语义一致（不强制邮箱格式）。
  @ApiProperty({
    description: "账号（员工账号/种子账号等，区分大小写不敏感）",
    example: "admin",
  })
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(1)
  @MaxLength(128)
  account!: string;

  @ApiProperty({
    description: "密码（明文传入，服务端使用 bcrypt 校验；不会在任何响应中回传）",
    example: "admin",
  })
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(6)
  @MaxLength(128)
  password!: string;
}
