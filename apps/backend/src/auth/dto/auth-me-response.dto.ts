import { ApiProperty } from "@nestjs/swagger";
import { AuthUserDto } from "./auth-user.dto";

export class AuthMeDataDto {
  @ApiProperty({ description: "当前用户信息（由 JWT 注入）", type: AuthUserDto })
  user!: AuthUserDto;
}

