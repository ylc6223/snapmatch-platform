import { ApiProperty } from "@nestjs/swagger";
import { PackageEntity } from "../../database/entities/package.entity";

export class PackageResponseDto {
  @ApiProperty({ description: "套餐ID" })
  id!: string;

  @ApiProperty({ description: "套餐名称" })
  name!: string;

  @ApiProperty({ description: "套餐描述", required: false })
  description?: string;

  @ApiProperty({ description: "包含精修张数" })
  includedRetouchCount!: number;

  @ApiProperty({ description: "包含入册张数" })
  includedAlbumCount!: number;

  @ApiProperty({ description: "价格（分）", required: false })
  price?: number;

  @ApiProperty({ description: "是否启用" })
  isActive!: boolean;

  @ApiProperty({ description: "排序" })
  sort!: number;

  static fromEntity(entity: PackageEntity): PackageResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description ?? undefined,
      includedRetouchCount: entity.includedRetouchCount,
      includedAlbumCount: entity.includedAlbumCount,
      price: entity.price ?? undefined,
      isActive: entity.isActive,
      sort: entity.sort,
    };
  }
}

