import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray, IsEmail } from "class-validator";

export class CreateCustomerDto {
  @ApiProperty({ description: "客户姓名", example: "张三" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name!: string;

  @ApiProperty({ description: "手机号", example: "13800138000" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;

  @ApiProperty({ description: "微信 OpenID", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  wechatOpenId?: string;

  @ApiProperty({ description: "邮箱", required: false, example: "zhangsan@example.com" })
  @IsEmail()
  @IsOptional()
  @MaxLength(256)
  email?: string;

  @ApiProperty({ description: "备注说明", required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: "标签数组", required: false, type: [String], example: ["VIP", "老客户"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
