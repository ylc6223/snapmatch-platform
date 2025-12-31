import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ListUsersQuery {
  @ApiPropertyOptional({ description: "账号关键字（模糊匹配）", example: "admin" })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MaxLength(128)
  q?: string;

  @ApiPropertyOptional({ description: "页码（从 1 开始）", example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null || value === undefined ? value : Number(value)))
  page?: number;

  @ApiPropertyOptional({ description: "每页数量（1-100）", example: 20 })
  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null || value === undefined ? value : Number(value)))
  pageSize?: number;

  @ApiPropertyOptional({ description: "状态筛选：1=启用，0=禁用", enum: [0, 1] })
  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null || value === undefined ? value : Number(value)))
  @IsIn([0, 1])
  status?: 0 | 1;
}

