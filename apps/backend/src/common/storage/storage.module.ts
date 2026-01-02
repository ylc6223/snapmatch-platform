import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * 云存储模块
 *
 * 提供 StorageService 作为全局服务
 */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
