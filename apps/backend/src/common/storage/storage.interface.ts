/**
 * 云存储提供商抽象接口
 *
 * 设计目标：
 * 1. 统一不同云存储提供商（七牛云、腾讯云 COS 等）的 API 调用
 * 2. 支持通过环境变量轻松切换存储提供商
 * 3. 便于未来从七牛云迁移到腾讯云 COS
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
}

/**
 * 云存储提供商接口
 *
 * 所有云存储提供商（七牛云、腾讯云 COS 等）都必须实现此接口
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
   * // 返回：{ token: 'xxx', uploadUrl: 'https://upload.qiniup.com', objectKey: '...', expiresIn: 3600 }
   * ```
   */
  generateUploadToken(
    objectKey: string,
    expiresIn: number,
  ): Promise<UploadTokenResult>;

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
