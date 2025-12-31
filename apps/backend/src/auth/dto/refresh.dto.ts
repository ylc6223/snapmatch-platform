import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RefreshDto {
  @ApiProperty({
    description: "refresh token（登录时返回；用于续期 accessToken，会旋转并更新有效期）",
    example: "rt_example_please_replace",
  })
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
