/**
 * 云存储模块统一导出
 *
 * 使用示例：
 * ```typescript
 * import { StorageService, IStorageProvider } from '@/common/storage';
 * ```
 */

export * from './storage.interface';
export * from './storage.service';
export { QiniuStorageProvider } from './providers/qiniu.provider';
