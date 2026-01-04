import { Transform } from "class-transformer";
import { IsArray, IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "../../auth/types";

export class CreateUserDto {
  @ApiProperty({ description: "账号（不区分大小写；服务端会转为小写存储）", example: "sales_01" })
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(1)
  @MaxLength(128)
  account!: string;

  @ApiProperty({ description: "初始密码（明文，仅用于创建/重置；不会回传）", example: "ChangeMe123" })
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ description: "角色列表（支持多选）", isArray: true, enum: Role, example: [Role.Sales] })
  @IsArray()
  @IsEnum(Role, { each: true })
  roleCodes!: Role[];

  @ApiPropertyOptional({ description: "状态：1=启用，0=禁用", enum: [0, 1], example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null || value === undefined ? value : Number(value)))
  @IsIn([0, 1])
  status?: 0 | 1;
}

