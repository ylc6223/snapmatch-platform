import { ApiProperty } from "@nestjs/swagger";
import { AuthUserDto } from "./auth-user.dto";

export class AuthLoginDataDto {
  @ApiProperty({
    description: "JWT accessToken（短期）",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  accessToken!: string;

  @ApiProperty({
    description: "refresh token（用于续期，会旋转）",
    example: "rt_example_please_replace",
  })
  refreshToken!: string;

  @ApiProperty({ description: "refresh token 过期时间（毫秒时间戳）", example: 1730000000000 })
  refreshExpiresAt!: number;

  @ApiProperty({ description: "当前用户信息（用于前端展示 & RBAC）", type: AuthUserDto })
  user!: AuthUserDto;
}

