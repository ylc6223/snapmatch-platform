import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { ApiErrorItem } from "../types/api-response";

export class ApiErrorItemDto implements ApiErrorItem {
  @ApiProperty({ description: "字段路径", example: "password" })
  field!: string;

  @ApiProperty({ description: "错误原因", example: "must be longer than or equal to 6 characters" })
  reason!: string;
}

export class ApiResponseBaseDto {
  @ApiProperty({ description: "业务 code（成功固定 200）", example: 200 })
  code!: number;

  @ApiProperty({ description: "message（成功固定 success）", example: "success" })
  message!: string;

  @ApiProperty({ description: "服务端时间戳（毫秒）", example: 1730000000000 })
  timestamp!: number;

  @ApiPropertyOptional({ description: "错误列表（仅失败时返回）", type: ApiErrorItemDto, isArray: true })
  errors?: ApiErrorItemDto[];
}

export class EmptyDto {}
