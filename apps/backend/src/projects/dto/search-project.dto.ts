import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber, Min, Max } from "class-validator";

export class SearchProjectDto {
  @ApiProperty({
    description: "搜索关键词（项目名称或客户名称）",
    example: "婚礼",
  })
  @IsString()
  query!: string;

  @ApiProperty({
    description: "返回结果数量限制",
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class SearchResultItemDto {
  @ApiProperty({ description: "项目ID" })
  id!: string;

  @ApiProperty({ description: "项目名称" })
  name!: string;

  @ApiProperty({ description: "客户名称", required: false })
  customerName?: string;

  @ApiProperty({ description: "项目状态" })
  status!: string;

  @ApiProperty({ description: "访问URL" })
  viewerUrl!: string;
}

export class SearchResponseDto {
  @ApiProperty({ description: "搜索结果列表", type: [SearchResultItemDto] })
  results!: SearchResultItemDto[];

  @ApiProperty({ description: "结果总数" })
  total!: number;
}
