import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsNumber } from "class-validator";

export class CreateProjectDto {
  @ApiProperty({ description: "项目名称", example: "李四婚纱照选片" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name!: string;

  @ApiProperty({ description: "项目描述", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "客户 ID" })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ description: "套餐 ID" })
  @IsString()
  @IsNotEmpty()
  packageId!: string;

  @ApiProperty({ description: "拍摄日期（毫秒时间戳）", required: false })
  @IsNumber()
  @IsOptional()
  shootDate?: number;

  @ApiProperty({ description: "过期时间戳（毫秒）", required: false })
  @IsNumber()
  @IsOptional()
  expiresAt?: number;
}
