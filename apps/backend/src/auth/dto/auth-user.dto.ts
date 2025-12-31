import { ApiProperty } from "@nestjs/swagger";
import { Role } from "../types";

export class AuthUserDto {
  @ApiProperty({ description: "用户 ID（CloudBase 数据模型 _id）", example: "CRB6R8G480" })
  id!: string;

  @ApiProperty({ description: "账号", example: "admin" })
  account!: string;

  @ApiProperty({
    description: "角色列表（RBAC role code）",
    example: [Role.Admin],
    enum: Role,
    isArray: true,
  })
  roles!: Role[];

  @ApiProperty({
    description: "权限点列表（permissions 包含 \"*\" 视为管理员兜底放行）",
    example: ["*"],
    isArray: true,
  })
  permissions!: string[];
}

