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
export { R2StorageProvider } from './providers/r2.provider';
