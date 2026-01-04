import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageService } from '../common/storage/storage.service';
import { MultipartCompletedPart, UploadTokenResult } from '../common/storage/storage.interface';
import { PhotoEntity, PhotoStatus } from '../database/entities/photo.entity';
import { ProjectsService } from '../projects/projects.service';

/**
 * 文件大小限制（字节）
 */
const FILE_SIZE_LIMITS = {
  'portfolio-asset': {
    image: 20 * 1024 * 1024, // 20MB
    video: 200 * 1024 * 1024, // 200MB
  },
  'delivery-photo': {
    image: 50 * 1024 * 1024, // 50MB
  },
} as const;

/**
 * 允许的文件类型
 */
const ALLOWED_CONTENT_TYPES = {
  'portfolio-asset': [
    // 图片
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    // 视频
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
  ],
  'delivery-photo': [
    // 图片
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
} as const;

/**
 * 资产上传用途类型
 */
type UploadPurpose = 'portfolio-asset' | 'delivery-photo';

@Injectable()
export class AssetsService {
  constructor(
    private readonly storageService: StorageService,
    @InjectRepository(PhotoEntity)
    private readonly photoRepository: Repository<PhotoEntity>,
    private readonly projectsService: ProjectsService,
  ) {}

  /**
   * 生成上传凭证
   *
   * @param purpose 上传用途（portfolio-asset 或 delivery-photo）
   * @param filename 原始文件名
   * @param contentType 文件 MIME 类型
   * @param size 文件大小（字节）
   * @param projectId 项目 ID（delivery-photo 场景下可选，用于权限校验）
   * @param workId 作品 ID（portfolio-asset 场景下可选，用于权限校验）
   * @returns 上传凭证信息
   */
  async generateUploadToken(
    purpose: UploadPurpose,
    filename: string,
    contentType: string,
    size: number,
    projectId?: string,
  ): Promise<UploadTokenResult> {
    // 1. 验证文件类型
    this.validateContentType(purpose, contentType);

    // 2. 验证文件大小
    this.validateFileSize(purpose, contentType, size);

    // 3. 生成对象存储键
    const objectKey = this.generateObjectKey(purpose, filename, projectId);

    // 4. 生成上传凭证（有效期 1 小时）
    const expiresIn = 3600;
    const providerType = this.storageService.getProviderType();
    if (providerType === 'r2') {
      const init = await this.storageService.createMultipartUpload(
        objectKey,
        contentType,
        expiresIn,
      );
      return {
        token: '',
        uploadUrl: '',
        objectKey: init.objectKey,
        expiresIn: init.expiresIn ?? expiresIn,
        uploadStrategy: 's3-multipart',
        uploadId: init.uploadId,
        partSize: init.partSize,
      };
    }

    const tokenResult = await this.storageService.generateUploadToken(objectKey, expiresIn);
    return { ...tokenResult, uploadStrategy: 's3-presigned-put' };
  }

  /**
   * 验证文件类型是否允许
   */
  private validateContentType(purpose: UploadPurpose, contentType: string): void {
    const allowedTypes = ALLOWED_CONTENT_TYPES[purpose] as readonly string[];

    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException({
        errorCode: 'INVALID_CONTENT_TYPE',
        message: `不支持的文件类型：${contentType}`,
        allowedTypes,
      });
    }
  }

  /**
   * 验证文件大小是否符合限制
   */
  private validateFileSize(purpose: UploadPurpose, contentType: string, size: number): void {
    const isImage = contentType.startsWith('image/');

    let maxSize: number;

    if (purpose === 'portfolio-asset') {
      maxSize = isImage
        ? FILE_SIZE_LIMITS['portfolio-asset'].image
        : FILE_SIZE_LIMITS['portfolio-asset'].video;
    } else {
      // delivery-photo 只支持图片
      maxSize = FILE_SIZE_LIMITS['delivery-photo'].image;
    }

    if (size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
      const currentSizeMB = (size / 1024 / 1024).toFixed(2);

      throw new BadRequestException({
        errorCode: 'FILE_TOO_LARGE',
        message: `文件大小超过限制：${currentSizeMB}MB > ${maxSizeMB}MB`,
        maxSize,
        currentSize: size,
      });
    }
  }

  /**
   * 生成对象存储键
   *
   * 路径规则：
   * - Portfolio Asset: portfolio/assets/{YYYY}/{MM}/{uuid}-{filename}
   * - Delivery Photo: delivery/photos/{projectId}/{albumId}/{uuid}-{filename}
   */
  private generateObjectKey(purpose: UploadPurpose, filename: string, projectId?: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // 生成唯一标识符
    const uniqueId = uuidv4();

    if (purpose === 'portfolio-asset') {
      // 作品集素材路径
      return `portfolio/assets/${year}/${month}/${uniqueId}-${filename}`;
    } else {
      // 交付照片路径
      if (!projectId) {
        throw new BadRequestException({
          errorCode: 'MISSING_PROJECT_ID',
          message: '交付照片上传必须提供 projectId',
        });
      }

      // TODO: 当前使用 projectId 作为相册 ID，未来可能需要独立的 albumId
      const albumId = projectId;
      return `delivery/photos/${projectId}/${albumId}/${uniqueId}-${filename}`;
    }
  }

  /**
   * 确认交付照片上传
   *
   * @param confirmDto 确认信息
   * @returns 照片 ID 和访问 URL
   */
  async confirmDeliveryPhoto(confirmDto: {
    projectId: string;
    albumId?: string;
    objectKey: string;
    filename: string;
    size: number;
    contentType: string;
    exif?: {
      camera?: string;
      lens?: string;
      iso?: number;
      aperture?: string;
      shutter?: string;
    };
  }) {
    const { objectKey } = confirmDto;

    // 1. 验证文件是否存在于云存储
    const fileExists = await this.storageService.fileExists(objectKey);
    if (!fileExists) {
      throw new NotFoundException({
        errorCode: 'FILE_NOT_FOUND',
        message: `文件不存在于云存储：${objectKey}`,
        objectKey,
      });
    }

    // 2. 生成照片 ID
    const photoId = `pho_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

    // 3. 保存照片元数据到数据库（Photo 表）
    const now = Date.now();
    const photo = this.photoRepository.create({
      id: photoId,
      projectId: confirmDto.projectId,
      filename: confirmDto.filename,
      originalKey: objectKey,
      previewKey: objectKey, // TODO: 暂时使用原图，后续替换为带水印预览图
      thumbKey: null, // TODO: 暂时为空，后续生成缩略图后更新
      fileSize: confirmDto.size,
      width: null,
      height: null, // TODO: 后续从 EXIF 或图像处理中提取尺寸
      status: PhotoStatus.READY,
      createdAt: now,
    });

    await this.photoRepository.save(photo);

    // 4. 更新项目的照片计数
    await this.projectsService.incrementPhotoCount(confirmDto.projectId);

    // 4. 生成各种变体的 URL
    const originalUrl = await this.storageService.generatePrivateDownloadUrl(objectKey, 3600);

    // TODO: 5. 异步处理（队列 Worker）：
    // - 生成缩略图（列表展示，300x300）
    // - 生成预览图（选片用，1920x1080 + 强制水印）
    // - 保留原图（私有读权限）
    //
    // 目前暂时返回原图作为所有变体，后续实现异步处理后更新

    return {
      photoId,
      status: 'ready' as const,
      variants: {
        // TODO: 暂时使用原图，后续替换为实际缩略图
        thumbnail: originalUrl,
        // TODO: 暂时使用原图，后续替换为带水印的预览图
        preview: originalUrl,
        original: originalUrl,
      },
    };
  }

  /**
   * 确认作品集素材上传
   *
   * @param workId 作品 ID
   * @param confirmDto 确认信息
   * @returns 资产 ID 和访问 URL
   */
  async confirmPortfolioAsset(
    workId: string,
    confirmDto: {
      objectKey: string;
      filename: string;
      size: number;
      contentType: string;
      type: 'image' | 'video';
      sort?: number;
      isCover?: boolean;
    },
  ) {
    const { objectKey, type } = confirmDto;

    // 1. 验证文件是否存在于云存储
    const fileExists = await this.storageService.fileExists(objectKey);
    if (!fileExists) {
      throw new NotFoundException({
        errorCode: 'FILE_NOT_FOUND',
        message: `文件不存在于云存储：${objectKey}`,
        objectKey,
      });
    }

    // 2. 生成资产 ID
    const assetId = `asset_${uuidv4()}`;

    // TODO: 3. 验证作品 ID 是否存在
    // const work = await this.worksRepository.findById(workId);
    // if (!work) {
    //   throw new NotFoundException({
    //     errorCode: 'WORK_NOT_FOUND',
    //     message: `作品不存在：${workId}`,
    //     workId,
    //   });
    // }

    // TODO: 4. 保存资产元数据到数据库（WorkAsset 表）
    // await this.workAssetsRepository.create({
    //   id: assetId,
    //   workId,
    //   objectKey,
    //   filename: confirmDto.filename,
    //   size: confirmDto.size,
    //   contentType: confirmDto.contentType,
    //   type,
    //   sort: confirmDto.sort ?? 0,
    //   isCover: confirmDto.isCover ?? false,
    // });

    // 5. 生成访问 URL
    //
    // 作品集素材在生产环境通常走“公开 CDN 域名”；
    // 但本地/开发环境使用 R2 时未必配置了公开域名，因此在 R2 下回退为临时签名 URL（便于联调）。
    const url =
      this.storageService.getProviderType() === 'r2'
        ? await this.storageService.generatePrivateDownloadUrl(objectKey, 3600)
        : this.storageService.getPublicUrl(objectKey);

    // TODO: 6. 异步生成缩略图（仅图片）
    // const thumbnails = type === 'image' ? {
    //   small: await this.generateThumbnail(objectKey, 200, 200),
    //   medium: await this.generateThumbnail(objectKey, 800, 600),
    //   large: await this.generateThumbnail(objectKey, 1920, 1080),
    // } : undefined;

    const thumbnails =
      type === 'image'
        ? {
            // TODO: 暂时使用原图，后续替换为实际缩略图
            small: url,
            medium: url,
            large: url,
          }
        : undefined;

    return {
      assetId,
      url,
      thumbnails,
    };
  }

  /**
   * 分片上传：签名某个 part（用于前端直传）
   */
  async signUploadPart(input: { objectKey: string; uploadId: string; partNumber: number }) {
    if (this.storageService.getProviderType() !== 'r2') {
      throw new BadRequestException({
        errorCode: 'MULTIPART_NOT_SUPPORTED',
        message: '当前存储提供商不支持分片上传',
      });
    }
    const expiresIn = 3600;
    return this.storageService.signUploadPart(
      input.objectKey,
      input.uploadId,
      input.partNumber,
      expiresIn,
    );
  }

  async listUploadedParts(input: { objectKey: string; uploadId: string }) {
    if (this.storageService.getProviderType() !== 'r2') {
      throw new BadRequestException({
        errorCode: 'MULTIPART_NOT_SUPPORTED',
        message: '当前存储提供商不支持分片上传',
      });
    }
    return this.storageService.listUploadedParts(input.objectKey, input.uploadId);
  }

  async completeMultipartUpload(input: {
    objectKey: string;
    uploadId: string;
    parts: MultipartCompletedPart[];
  }) {
    if (this.storageService.getProviderType() !== 'r2') {
      throw new BadRequestException({
        errorCode: 'MULTIPART_NOT_SUPPORTED',
        message: '当前存储提供商不支持分片上传',
      });
    }
    await this.storageService.completeMultipartUpload(input.objectKey, input.uploadId, input.parts);
    return { ok: true as const };
  }

  async abortMultipartUpload(input: { objectKey: string; uploadId: string }) {
    if (this.storageService.getProviderType() !== 'r2') {
      throw new BadRequestException({
        errorCode: 'MULTIPART_NOT_SUPPORTED',
        message: '当前存储提供商不支持分片上传',
      });
    }
    await this.storageService.abortMultipartUpload(input.objectKey, input.uploadId);
    return { ok: true as const };
  }

  /**
   * 列出所有未完成的分片上传
   * @param olderThanSeconds 可选：只返回超过此时间（秒）的未完成上传
   */
  async listIncompleteUploads(olderThanSeconds?: number) {
    if (this.storageService.getProviderType() !== 'r2') {
      throw new BadRequestException({
        errorCode: 'FEATURE_NOT_SUPPORTED',
        message: '当前存储提供商不支持列出未完成上传',
      });
    }

    const uploads = await this.storageService.listMultipartUploads();

    console.log('[AssetsService] listIncompleteUploads result:', {
      uploadsCount: uploads.length,
      firstUpload: uploads[0],
      filter: olderThanSeconds ? `older than ${olderThanSeconds}s` : 'no filter',
    });

    // 如果指定了时间过滤，筛选出超过指定时间的上传
    let filteredUploads = uploads;
    if (olderThanSeconds && olderThanSeconds > 0) {
      const cutoffDate = new Date(Date.now() - olderThanSeconds * 1000);
      filteredUploads = uploads.filter((upload) => upload.initiated < cutoffDate);
      console.log('[AssetsService] after time filter:', {
        beforeCount: uploads.length,
        afterCount: filteredUploads.length,
        cutoffDate: cutoffDate.toISOString(),
      });
    }

    const result = {
      uploads: filteredUploads.map((upload) => ({
        objectKey: upload.objectKey,
        uploadId: upload.uploadId,
        initiated: upload.initiated.toISOString(),
      })),
      total: filteredUploads.length,
    };

    console.log('[AssetsService] returning to controller:', {
      uploadsCount: result.uploads.length,
      total: result.total,
    });

    return result;
  }

  /**
   * 清理所有未完成的分片上传
   * @param olderThanSeconds 可选：只清理超过此时间（秒）的未完成上传
   */
  async cleanupIncompleteUploads(olderThanSeconds?: number) {
    if (this.storageService.getProviderType() !== 'r2') {
      throw new BadRequestException({
        errorCode: 'FEATURE_NOT_SUPPORTED',
        message: '当前存储提供商不支持清理未完成上传',
      });
    }

    // 如果指定了时间过滤，先列出并筛选
    if (olderThanSeconds && olderThanSeconds > 0) {
      const uploads = await this.storageService.listMultipartUploads();
      const cutoffDate = new Date(Date.now() - olderThanSeconds * 1000);
      const filteredUploads = uploads.filter((upload) => upload.initiated < cutoffDate);

      console.log('[AssetsService] cleanup with filter:', {
        totalUploads: uploads.length,
        toCleanup: filteredUploads.length,
        cutoffDate: cutoffDate.toISOString(),
      });

      // 只清理筛选出的上传
      const details: Array<{ objectKey: string; uploadId: string; success: boolean; error?: string }> =
        [];
      let cleaned = 0;
      let failed = 0;

      for (const upload of filteredUploads) {
        try {
          await this.storageService.abortMultipartUpload(upload.objectKey, upload.uploadId);
          cleaned++;
          details.push({
            objectKey: upload.objectKey,
            uploadId: upload.uploadId,
            success: true,
          });
        } catch (error) {
          failed++;
          details.push({
            objectKey: upload.objectKey,
            uploadId: upload.uploadId,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return {
        cleaned,
        failed,
        total: cleaned + failed,
        details,
      };
    }

    // 没有时间过滤，清理所有未完成的上传
    const result = await this.storageService.cleanupIncompleteUploads();

    return {
      cleaned: result.cleaned,
      failed: result.failed,
      total: result.cleaned + result.failed,
      details: result.details,
    };
  }
}
