import { ApiProperty } from "@nestjs/swagger";
import { CustomerEntity } from "../../database/entities/customer.entity";

export class CustomerResponseDto {
  @ApiProperty({ description: "客户 ID" })
  id!: string;

  @ApiProperty({ description: "客户姓名" })
  name!: string;

  @ApiProperty({ description: "手机号" })
  phone!: string;

  @ApiProperty({ description: "微信 OpenID", required: false })
  wechatOpenId?: string;

  @ApiProperty({ description: "邮箱", required: false })
  email?: string;

  @ApiProperty({ description: "备注说明", required: false })
  notes?: string;

  @ApiProperty({ description: "标签数组", required: false, type: [String] })
  tags?: string[];

  @ApiProperty({ description: "创建时间（毫秒时间戳）" })
  createdAt!: number;

  @ApiProperty({ description: "更新时间（毫秒时间戳）" })
  updatedAt!: number;

  static fromEntity(entity: CustomerEntity): CustomerResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      phone: entity.phone,
      wechatOpenId: entity.wechatOpenId ?? undefined,
      email: entity.email ?? undefined,
      notes: entity.notes ?? undefined,
      tags: entity.tags ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
