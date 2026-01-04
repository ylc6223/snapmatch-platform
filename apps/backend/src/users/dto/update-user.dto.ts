import { Transform } from "class-transformer";
import { IsArray, IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "../../auth/types";

export class UpdateUserDto {
  @ApiPropertyOptional({ description: "重置密码（留空表示不修改）", example: "NewPassword123" })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(6)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({ description: "角色列表（支持多选；传空数组表示清空）", isArray: true, enum: Role })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roleCodes?: Role[];

  @ApiPropertyOptional({ description: "状态：1=启用，0=禁用", enum: [0, 1], example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null || value === undefined ? value : Number(value)))
  @IsIn([0, 1])
  status?: 0 | 1;
}

