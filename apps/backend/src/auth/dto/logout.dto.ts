import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LogoutDto {
  @ApiProperty({
    description: "refresh token（用于服务端登出/踢下线，成功后对应会话立即失效）",
    example: "rt_example_please_replace",
  })
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
