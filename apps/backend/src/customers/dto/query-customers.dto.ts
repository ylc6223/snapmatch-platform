import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { CustomerResponseDto } from "./customer-response.dto";

export class QueryCustomersDto {
  @ApiProperty({ description: "搜索关键词（姓名或手机号）", required: false })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({ description: "页码", required: false, default: 1, minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: "每页数量", required: false, default: 20, minimum: 1, maximum: 100 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 20;

  @ApiProperty({ description: "排序字段", required: false, enum: ["createdAt", "updatedAt", "name"] })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiProperty({ description: "排序方向", required: false, enum: ["asc", "desc"] })
  @IsString()
  @IsOptional()
  sortOrder?: "asc" | "desc";
}

export class PaginatedCustomersResponseDto {
  @ApiProperty({ description: "客户列表", type: [CustomerResponseDto] })
  items!: CustomerResponseDto[];

  @ApiProperty({ description: "总数" })
  total!: number;

  @ApiProperty({ description: "当前页码" })
  page!: number;

  @ApiProperty({ description: "每页数量" })
  pageSize!: number;
}
