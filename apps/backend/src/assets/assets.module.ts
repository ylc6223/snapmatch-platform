import { Module } from '@nestjs/common';
import { AssetsController, PhotosController, WorksController } from './assets.controller';
import { AssetsService } from './assets.service';
import { StorageModule } from '../common/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [AssetsController, PhotosController, WorksController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
