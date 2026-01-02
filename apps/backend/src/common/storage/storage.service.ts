/**
 * 统一存储服务
 *
 * 根据环境变量 STORAGE_PROVIDER 自动选择云存储提供商
 * 支持 Cloudflare R2（r2）与腾讯云 COS（cos，预留）
 *
 * 使用方式：
 * ```typescript
 * import { StorageService } from '@/common/storage';
 *
 * // 在模块中注入
 * @Injectable()
 * export class AssetsService {
 *   constructor(private storageService: StorageService) {}
 *
 *   async uploadFile(file: File) {
 *     const token = await this.storageService.generateUploadToken('path/to/file.jpg', 3600);
 *     // ...
 *   }
 * }
 * ```
 */

import { Injectable } from '@nestjs/common';
import { R2StorageProvider } from './providers/r2.provider';
import {
  IMultipartUploadProvider,
  IStorageProvider,
  MultipartCompletedPart,
  MultipartUploadInitResult,
  MultipartUploadPartUrlResult,
  UploadTokenResult,
} from './storage.interface';

/**
 * 存储提供商类型
 */
type StorageProviderType = 'r2' | 'cos';

/**
 * 统一存储服务
 *
 * 实现 IStorageProvider 接口，作为所有云存储操作的统一入口
 * 内部根据环境变量 STORAGE_PROVIDER 动态选择具体的云存储实现
 */
@Injectable()
export class StorageService implements IStorageProvider {
  private provider: IStorageProvider;
  private providerType: StorageProviderType;

  constructor() {
    // 从环境变量读取存储提供商类型
    const providerType = (process.env.STORAGE_PROVIDER || 'r2') as StorageProviderType;
    this.providerType = providerType;

    // 根据提供商类型选择实现
    switch (providerType) {
      case 'cos':
        // TODO: 未来实现腾讯云 COS 提供商
        // this.provider = new CosStorageProvider();
        throw new Error('腾讯云 COS 提供商尚未实现，请使用 Cloudflare R2（STORAGE_PROVIDER=r2）');

      case 'r2':
      default:
        this.provider = new R2StorageProvider();
        break;
    }

    console.log(`[StorageService] 已初始化存储提供商：${providerType}`);
  }

  /**
   * 获取当前使用的存储提供商类型
   */
  getProviderType(): StorageProviderType {
    return this.providerType;
  }

  /**
   * 生成上传凭证
   */
  async generateUploadToken(objectKey: string, expiresIn: number): Promise<UploadTokenResult> {
    return this.provider.generateUploadToken(objectKey, expiresIn);
  }

  /**
   * 创建分片上传（仅支持部分 provider，例如 Cloudflare R2）
   */
  async createMultipartUpload(
    objectKey: string,
    contentType: string,
    expiresIn: number,
  ): Promise<MultipartUploadInitResult> {
    const provider = this.provider as IStorageProvider & Partial<IMultipartUploadProvider>;
    if (!provider.createMultipartUpload) {
      throw new Error(`当前存储提供商不支持分片上传：${this.providerType}`);
    }
    return provider.createMultipartUpload(objectKey, contentType, expiresIn);
  }

  async signUploadPart(
    objectKey: string,
    uploadId: string,
    partNumber: number,
    expiresIn: number,
  ): Promise<MultipartUploadPartUrlResult> {
    const provider = this.provider as IStorageProvider & Partial<IMultipartUploadProvider>;
    if (!provider.signUploadPart) {
      throw new Error(`当前存储提供商不支持分片上传：${this.providerType}`);
    }
    return provider.signUploadPart(objectKey, uploadId, partNumber, expiresIn);
  }

  async completeMultipartUpload(
    objectKey: string,
    uploadId: string,
    parts: MultipartCompletedPart[],
  ): Promise<void> {
    const provider = this.provider as IStorageProvider & Partial<IMultipartUploadProvider>;
    if (!provider.completeMultipartUpload) {
      throw new Error(`当前存储提供商不支持分片上传：${this.providerType}`);
    }
    return provider.completeMultipartUpload(objectKey, uploadId, parts);
  }

  async abortMultipartUpload(objectKey: string, uploadId: string): Promise<void> {
    const provider = this.provider as IStorageProvider & Partial<IMultipartUploadProvider>;
    if (!provider.abortMultipartUpload) {
      throw new Error(`当前存储提供商不支持分片上传：${this.providerType}`);
    }
    return provider.abortMultipartUpload(objectKey, uploadId);
  }

  async listUploadedParts(objectKey: string, uploadId: string): Promise<MultipartCompletedPart[]> {
    const provider = this.provider as IStorageProvider & Partial<IMultipartUploadProvider>;
    if (!provider.listUploadedParts) {
      throw new Error(`当前存储提供商不支持分片上传：${this.providerType}`);
    }
    return provider.listUploadedParts(objectKey, uploadId);
  }

  /**
   * 获取公开访问 URL
   */
  getPublicUrl(objectKey: string): string {
    return this.provider.getPublicUrl(objectKey);
  }

  /**
   * 生成私有下载凭证（临时签名 URL）
   */
  async generatePrivateDownloadUrl(objectKey: string, expiresIn?: number): Promise<string> {
    return this.provider.generatePrivateDownloadUrl(objectKey, expiresIn);
  }

  /**
   * 删除文件
   */
  async deleteFile(objectKey: string): Promise<void> {
    return this.provider.deleteFile(objectKey);
  }

  /**
   * 批量删除文件
   */
  async deleteFiles(objectKeys: string[]): Promise<void> {
    return this.provider.deleteFiles(objectKeys);
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(objectKey: string): Promise<boolean> {
    return this.provider.fileExists(objectKey);
  }
}
