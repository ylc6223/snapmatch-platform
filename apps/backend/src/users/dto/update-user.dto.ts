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

  @ApiPropertyOptional({
    description: "用户类型（用于业务侧分类展示；与角色不同）",
    enum: ["photographer", "sales", "customer"],
    example: "sales",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsIn(["photographer", "sales", "customer"])
  userType?: string;

  @ApiPropertyOptional({ description: "状态：1=启用，0=禁用", enum: [0, 1], example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null || value === undefined ? value : Number(value)))
  @IsIn([0, 1])
  status?: 0 | 1;

  @ApiPropertyOptional({ description: "角色（支持多选；传空数组表示清空）", isArray: true, enum: Role })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roleCodes?: Role[];
}

