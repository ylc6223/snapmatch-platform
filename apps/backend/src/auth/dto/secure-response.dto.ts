import { ApiProperty } from "@nestjs/swagger";

export class SecureOkDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ description: "权限验证范围（示例接口）", example: "admin" })
  scope?: string;

  @ApiProperty({ description: "需要的权限点（示例接口）", example: "packages:write" })
  permission?: string;
}

