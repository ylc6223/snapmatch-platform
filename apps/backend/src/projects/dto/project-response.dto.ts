import { ApiProperty } from "@nestjs/swagger";
import { ProjectEntity } from "../../database/entities/project.entity";

export class ProjectResponseDto {
  @ApiProperty({ description: "项目ID" })
  id!: string;

  @ApiProperty({ description: "项目名称" })
  name!: string;

  @ApiProperty({ description: "项目描述", required: false })
  description?: string;

  @ApiProperty({ description: "访问令牌" })
  token!: string;

  @ApiProperty({ description: "访问URL（客户端使用）" })
  viewerUrl!: string;

  @ApiProperty({ description: "过期时间", required: false })
  expiresAt?: number;

  @ApiProperty({ description: "状态" })
  status!: string;

  @ApiProperty({ description: "照片数量" })
  photoCount!: number;

  @ApiProperty({ description: "创建时间" })
  createdAt!: number;

  @ApiProperty({ description: "更新时间" })
  updatedAt!: number;

  static fromEntity(entity: ProjectEntity, baseUrl: string): ProjectResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description ?? undefined,
      token: entity.token,
      viewerUrl: `${baseUrl}/viewer/${entity.token}`,
      expiresAt: entity.expiresAt ?? undefined,
      status: entity.status,
      photoCount: entity.photoCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
