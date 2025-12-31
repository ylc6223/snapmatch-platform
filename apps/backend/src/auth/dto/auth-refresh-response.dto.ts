import { ApiProperty } from "@nestjs/swagger";

export class AuthRefreshDataDto {
  @ApiProperty({
    description: "新的 JWT accessToken",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  accessToken!: string;

  @ApiProperty({
    description: "旋转后的 refresh token",
    example: "rt_example_please_replace",
  })
  refreshToken!: string;

  @ApiProperty({ description: "refresh token 过期时间（毫秒时间戳）", example: 1730000000000 })
  refreshExpiresAt!: number;
}

