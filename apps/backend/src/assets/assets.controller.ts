import { Controller, Post, Body, Param, HttpCode, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * 签名请求 DTO
 */
interface SignAssetDto {
  /** 上传用途：portfolio-asset（作品集素材）或 delivery-photo（交付照片） */
  purpose: 'portfolio-asset' | 'delivery-photo';
  /** 文件名 */
  filename: string;
  /** 文件 MIME 类型 */
  contentType: string;
  /** 文件大小（字节） */
  size: number;
  /** 项目 ID（可选，用于权限校验和路径规划） */
  projectId?: string;
  /** 作品 ID（可选，用于权限校验和路径规划） */
  workId?: string;
}

/**
 * 签名响应 DTO
 */
interface SignAssetResponse {
  /** 上传凭证 */
  token: string;
  /** 上传端点 URL */
  uploadUrl: string;
  /** 对象存储路径 */
  objectKey: string;
  /** 过期时间（秒） */
  expiresIn: number;
}

@ApiTags('assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  /**
   * 生成上传签名
   *
   * 统一的上传签名接口，支持两种场景：
   * - portfolio-asset：作品集素材（用于小程序展示）
   * - delivery-photo：交付照片（用于客户选片/交付）
   *
   * @param signAssetDto 上传文件信息
   * @returns 上传凭证信息
   */
  @Post('sign')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '生成上传签名',
    description:
      '生成文件上传所需的签名凭证。' +
      '支持两种场景：portfolio-asset（作品集素材）和 delivery-photo（交付照片）。' +
      '前端使用返回的 token 直接上传到七牛云存储。',
  })
  @ApiResponse({
    status: 201,
    description: '签名生成成功',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: '上传凭证' },
        uploadUrl: { type: 'string', description: '上传端点 URL' },
        objectKey: { type: 'string', description: '对象存储路径' },
        expiresIn: { type: 'number', description: '过期时间（秒）' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '未授权（需要登录）',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  async sign(@Body() signAssetDto: SignAssetDto): Promise<SignAssetResponse> {
    const tokenResult = await this.assetsService.generateUploadToken(
      signAssetDto.purpose,
      signAssetDto.filename,
      signAssetDto.contentType,
      signAssetDto.size,
      signAssetDto.projectId,
    );

    // 确保 expiresIn 存在（实际总是存在）
    return {
      token: tokenResult.token,
      uploadUrl: tokenResult.uploadUrl,
      objectKey: tokenResult.objectKey,
      expiresIn: tokenResult.expiresIn || 3600, // 默认 1 小时
    };
  }
}

/**
 * 确认交付照片上传 DTO
 */
interface ConfirmDeliveryPhotoDto {
  /** 项目 ID */
  projectId: string;
  /** 子相册 ID（可选） */
  albumId?: string;
  /** 云存储对象键（原图） */
  objectKey: string;
  /** 文件名 */
  filename: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件 MIME 类型 */
  contentType: string;
  /** EXIF 信息（可选） */
  exif?: {
    camera?: string;
    lens?: string;
    iso?: number;
    aperture?: string;
    shutter?: string;
  };
}

/**
 * 确认交付照片响应
 */
interface ConfirmDeliveryPhotoResponse {
  /** 照片 ID */
  photoId: string;
  /** 处理状态 */
  status: 'processing' | 'ready';
  /** 变体 URL */
  variants: {
    /** 缩略图 URL（列表展示，300x300） */
    thumbnail: string;
    /** 预览图 URL（选片用，1920x1080 + 水印） */
    preview: string;
    /** 原图 URL（私有读，临时签名） */
    original: string;
  };
}

/**
 * 确认作品集素材上传 DTO
 */
interface ConfirmPortfolioAssetDto {
  /** 云存储对象键 */
  objectKey: string;
  /** 文件名 */
  filename: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件 MIME 类型 */
  contentType: string;
  /** 资源类型：image 或 video */
  type: 'image' | 'video';
  /** 排序权重（可选） */
  sort?: number;
  /** 是否为封面（可选） */
  isCover?: boolean;
}

/**
 * 确认作品集素材响应
 */
interface ConfirmPortfolioAssetResponse {
  /** 资产 ID */
  assetId: string;
  /** 访问 URL */
  url: string;
  /** 缩略图（仅图片） */
  thumbnails?: {
    /** 小图（200x200） */
    small: string;
    /** 中图（800x600） */
    medium: string;
    /** 大图（1920x1080） */
    large: string;
  };
}

@ApiTags('photos')
@Controller('photos')
export class PhotosController {
  constructor(private readonly assetsService: AssetsService) {}

  /**
   * 确认交付照片上传
   *
   * 前端完成文件上传后调用此接口确认，后端将保存元数据并返回访问 URL
   *
   * @param confirmDto 确认信息
   * @returns 照片 ID 和访问 URL
   */
  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '确认交付照片上传',
    description:
      '前端完成文件直传到七牛云后，调用此接口确认上传完成。' +
      '后端将验证文件存在、保存元数据到数据库，并返回各种变体的访问 URL。' +
      'TODO: 异步处理（缩略图、水印）将在后续实现。',
  })
  @ApiResponse({
    status: 200,
    description: '确认成功',
    schema: {
      type: 'object',
      properties: {
        photoId: { type: 'string', description: '照片 ID' },
        status: { type: 'string', enum: ['processing', 'ready'], description: '处理状态' },
        variants: {
          type: 'object',
          properties: {
            thumbnail: { type: 'string', description: '缩略图 URL' },
            preview: { type: 'string', description: '预览图 URL（带水印）' },
            original: { type: 'string', description: '原图 URL（私有读）' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权（需要登录）' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  async confirmDeliveryPhoto(
    @Body() confirmDto: ConfirmDeliveryPhotoDto,
  ): Promise<ConfirmDeliveryPhotoResponse> {
    return this.assetsService.confirmDeliveryPhoto(confirmDto);
  }
}

@ApiTags('works')
@Controller('works')
export class WorksController {
  constructor(private readonly assetsService: AssetsService) {}

  /**
   * 确认作品集素材上传
   *
   * 前端完成文件上传后调用此接口确认，后端将保存元数据并返回访问 URL
   *
   * @param workId 作品 ID
   * @param confirmDto 确认信息
   * @returns 资产 ID 和访问 URL
   */
  @Post(':workId/assets/confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '确认作品集素材上传',
    description:
      '前端完成文件直传到七牛云后，调用此接口确认上传完成。' +
      '后端将验证文件存在、保存元数据到数据库，并返回访问 URL 和缩略图。' +
      'TODO: 异步生成缩略图将在后续实现。',
  })
  @ApiParam({
    name: 'workId',
    description: '作品 ID',
    type: String,
    example: 'work_123456',
  })
  @ApiResponse({
    status: 200,
    description: '确认成功',
    schema: {
      type: 'object',
      properties: {
        assetId: { type: 'string', description: '资产 ID' },
        url: { type: 'string', description: '访问 URL' },
        thumbnails: {
          type: 'object',
          properties: {
            small: { type: 'string', description: '小图（200x200）' },
            medium: { type: 'string', description: '中图（800x600）' },
            large: { type: 'string', description: '大图（1920x1080）' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权（需要登录）' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '文件不存在或作品不存在' })
  async confirmPortfolioAsset(
    @Param('workId') workId: string,
    @Body() confirmDto: ConfirmPortfolioAssetDto,
  ): Promise<ConfirmPortfolioAssetResponse> {
    return this.assetsService.confirmPortfolioAsset(workId, confirmDto);
  }
}
