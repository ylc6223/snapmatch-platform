import { ApiProperty } from "@nestjs/swagger";
import { CustomerEntity } from "../../database/entities/customer.entity";

export class CustomerResponseDto {
  @ApiProperty({ description: "客户ID" })
  id!: string;

  @ApiProperty({ description: "客户名称" })
  name!: string;

  @ApiProperty({ description: "手机号" })
  phone!: string;

  static fromEntity(entity: CustomerEntity): CustomerResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      phone: entity.phone,
    };
  }
}

