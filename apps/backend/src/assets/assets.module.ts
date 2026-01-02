import { Module } from '@nestjs/common';
import {
  AssetsController,
  AssetsMultipartController,
  PhotosController,
  WorksController,
} from './assets.controller';
import { AssetsService } from './assets.service';
import { StorageModule } from '../common/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [AssetsController, AssetsMultipartController, PhotosController, WorksController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
