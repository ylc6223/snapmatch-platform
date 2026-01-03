/**
 * 云存储提供商抽象接口
 *
 * 设计目标：
 * 1. 统一不同云存储提供商（Cloudflare R2、腾讯云 COS 等）的 API 调用
 * 2. 支持通过环境变量轻松切换存储提供商
 * 3. 便于在本地/生产环境切换提供商
 *
 * 使用方式：
 * - 所有云存储操作通过 StorageService 调用
 * - StorageService 根据环境变量 STORAGE_PROVIDER 选择具体实现
 * - 业务代码不直接依赖具体的云存储 SDK
 */

/**
 * 上传凭证返回类型
 */
export interface UploadTokenResult {
  /** 上传凭证（Token 或签名 URL） */
  token: string;
  /** 上传端点 URL */
  uploadUrl: string;
  /** 对象存储键（文件路径） */
  objectKey: string;
  /** 过期时间（秒） */
  expiresIn?: number;
  /**
   * 上传策略（可选）
   *
   * - s3-presigned-put：S3 兼容的预签名 PUT（uploadUrl 即完整 URL）
   * - s3-multipart：S3 兼容的分片上传（uploadId + partSize，需要再签名每个 part）
   */
  uploadStrategy?: 's3-presigned-put' | 's3-multipart';
  /** 分片上传 ID（uploadStrategy=s3-multipart 时） */
  uploadId?: string;
  /** 分片大小（字节，uploadStrategy=s3-multipart 时） */
  partSize?: number;
}

/**
 * 分片上传已完成的分片信息
 *
 * 用于完成分片上传时，指定已上传成功的分片列表
 */
export interface MultipartCompletedPart {
  /** 分片编号（从 1 开始） */
  partNumber: number;
  /** 分片的 ETag 值，用于验证分片完整性 */
  etag: string;
}

/**
 * 分片上传初始化结果
 *
 * 返回分片上传会话的标识信息和参数
 */
export interface MultipartUploadInitResult {
  /** 分片上传会话 ID，用于后续上传、完成、取消操作 */
  uploadId: string;
  /** 对象存储键（文件路径） */
  objectKey: string;
  /** 建议的分片大小（字节） */
  partSize: number;
  /** 上传会话过期时间（秒） */
  expiresIn?: number;
}

/**
 * 分片上传部分签名 URL 结果
 *
 * 返回用于上传单个分片的预签名 URL
 */
export interface MultipartUploadPartUrlResult {
  /** 预签名的分片上传 URL */
  url: string;
  /** URL 过期时间（秒） */
  expiresIn?: number;
}

/**
 * 可选的分片上传能力（断点续传）
 *
 * 说明：不是所有 provider 都支持；业务侧需根据 providerType/能力做分支。
 */
export interface IMultipartUploadProvider {
  /**
   * 初始化分片上传会话
   *
   * @param objectKey 对象存储路径
   * @param contentType 文件 MIME 类型
   * @param expiresIn 上传会话过期时间（秒）
   * @returns 分片上传会话信息（包含 uploadId 和建议的 partSize）
   *
   * @example
   * ```typescript
   * const result = await provider.createMultipartUpload(
   *   'portfolio/assets/2025/01/large-video.mp4',
   *   'video/mp4',
   *   86400
   * );
   * // 返回：{ uploadId: '...', objectKey: '...', partSize: 5242880, expiresIn: 86400 }
   * ```
   */
  createMultipartUpload(
    objectKey: string,
    contentType: string,
    expiresIn: number,
  ): Promise<MultipartUploadInitResult>;

  /**
   * 生成单个分片的签名上传 URL
   *
   * @param objectKey 对象存储路径
   * @param uploadId 分片上传会话 ID
   * @param partNumber 分片编号（从 1 开始）
   * @param expiresIn 签名 URL 过期时间（秒）
   * @returns 分片上传的预签名 URL
   *
   * @example
   * ```typescript
   * const result = await provider.signUploadPart(
   *   'portfolio/assets/2025/01/large-video.mp4',
   *   'upload-id-123',
   *   1,
   *   3600
   * );
   * // 返回：{ url: 'https://...?partNumber=1&uploadId=...', expiresIn: 3600 }
   * ```
   */
  signUploadPart(
    objectKey: string,
    uploadId: string,
    partNumber: number,
    expiresIn: number,
  ): Promise<MultipartUploadPartUrlResult>;

  /**
   * 完成分片上传
   *
   * @param objectKey 对象存储路径
   * @param uploadId 分片上传会话 ID
   * @param parts 已上传成功的分片列表（按分片编号排序）
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await provider.completeMultipartUpload(
   *   'portfolio/assets/2025/01/large-video.mp4',
   *   'upload-id-123',
   *   [
   *     { partNumber: 1, etag: 'etag1' },
   *     { partNumber: 2, etag: 'etag2' },
   *     { partNumber: 3, etag: 'etag3' }
   *   ]
   * );
   * ```
   */
  completeMultipartUpload(
    objectKey: string,
    uploadId: string,
    parts: MultipartCompletedPart[],
  ): Promise<void>;

  /**
   * 取消分片上传
   *
   * @param objectKey 对象存储路径
   * @param uploadId 分片上传会话 ID
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await provider.abortMultipartUpload(
   *   'portfolio/assets/2025/01/large-video.mp4',
   *   'upload-id-123'
   * );
   * ```
   */
  abortMultipartUpload(objectKey: string, uploadId: string): Promise<void>;

  /**
   * 列出已上传的分片
   *
   * @param objectKey 对象存储路径
   * @param uploadId 分片上传会话 ID
   * @returns 已成功上传的分片列表
   *
   * @example
   * ```typescript
   * const parts = await provider.listUploadedParts(
   *   'portfolio/assets/2025/01/large-video.mp4',
   *   'upload-id-123'
   * );
   * // 返回：[{ partNumber: 1, etag: '...' }, { partNumber: 2, etag: '...' }]
   * ```
   */
  listUploadedParts(objectKey: string, uploadId: string): Promise<MultipartCompletedPart[]>;
}

/**
 * 云存储提供商接口
 *
 * 所有云存储提供商（Cloudflare R2、腾讯云 COS 等）都必须实现此接口
 */
export interface IStorageProvider {
  /**
   * 生成上传凭证
   *
   * @param objectKey 对象存储路径
   * @param expiresIn 过期时间（秒）
   * @returns 上传凭证信息
   *
   * @example
   * ```typescript
   * const result = await provider.generateUploadToken('portfolio/assets/2025/01/photo.jpg', 3600);
   * // 返回：{ uploadUrl: 'https://...presigned...', objectKey: '...', expiresIn: 3600 }
   * ```
   */
  generateUploadToken(objectKey: string, expiresIn: number): Promise<UploadTokenResult>;

  /**
   * 获取公开访问 URL
   *
   * @param objectKey 对象存储路径
   * @returns 公开访问的完整 URL
   *
   * @example
   * ```typescript
   * const url = provider.getPublicUrl('portfolio/assets/2025/01/photo.jpg');
   * // 返回：'https://cdn.snapmatch.com/portfolio/assets/2025/01/photo.jpg'
   * ```
   */
  getPublicUrl(objectKey: string): string;

  /**
   * 生成私有下载凭证（临时签名 URL）
   *
   * @param objectKey 对象存储路径
   * @param expiresIn 过期时间（秒），默认 3600（1小时）
   * @returns 临时签名的下载 URL
   *
   * @example
   * ```typescript
   * const url = await provider.generatePrivateDownloadUrl('delivery/photos/project1/photo.jpg', 300);
   * // 返回带签名的临时 URL，5分钟后过期
   * ```
   */
  generatePrivateDownloadUrl(objectKey: string, expiresIn?: number): Promise<string>;

  /**
   * 删除文件
   *
   * @param objectKey 对象存储路径
   *
   * @example
   * ```typescript
   * await provider.deleteFile('portfolio/assets/2025/01/photo.jpg');
   * ```
   */
  deleteFile(objectKey: string): Promise<void>;

  /**
   * 批量删除文件
   *
   * @param objectKeys 对象存储路径数组
   *
   * @example
   * ```typescript
   * await provider.deleteFiles([
   *   'portfolio/assets/2025/01/photo1.jpg',
   *   'portfolio/assets/2025/01/photo2.jpg'
   * ]);
   * ```
   */
  deleteFiles(objectKeys: string[]): Promise<void>;

  /**
   * 检查文件是否存在
   *
   * @param objectKey 对象存储路径
   * @returns 文件是否存在
   *
   * @example
   * ```typescript
   * const exists = await provider.fileExists('portfolio/assets/2025/01/photo.jpg');
   * if (exists) {
   *   console.log('文件存在');
   * }
   * ```
   */
  fileExists(objectKey: string): Promise<boolean>;
}
