import { ApiProperty } from "@nestjs/swagger";
import { ProjectEntity } from "../../database/entities/project.entity";
import { PhotoEntity } from "../../database/entities/photo.entity";
import { Project } from "@snapmatch/shared-types";

export class ProjectResponseDto implements Project {
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

  @ApiProperty({ description: "封面图URL", required: false })
  coverImageUrl?: string;

  static fromEntity(entity: ProjectEntity, baseUrl: string, firstPhoto?: PhotoEntity): ProjectResponseDto {
    // 确定封面图 URL：
    // 1. 如果项目设置了自定义封面，使用自定义封面
    // 2. 否则，如果有第一张照片，使用第一张照片的缩略图
    // 3. 都没有则不返回此字段
    let coverImageUrl: string | undefined;

    if (entity.coverImage) {
      // 自定义封面（需要配合你的云存储服务生成 URL）
      coverImageUrl = entity.coverImage;
    } else if (firstPhoto) {
      // 使用第一张照片的缩略图
      // 这里假设你有生成缩略图 URL 的方法
      // TODO: 根据你的云存储配置调整
      coverImageUrl = firstPhoto.thumbKey || firstPhoto.previewKey;
    }

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
      coverImageUrl,
    };
  }
}
