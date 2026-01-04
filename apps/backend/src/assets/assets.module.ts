import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AssetsController,
  AssetsMultipartController,
  PhotosController,
  WorksController,
} from './assets.controller';
import { AssetsService } from './assets.service';
import { StorageModule } from '../common/storage/storage.module';
import { PhotoEntity } from '../database/entities/photo.entity';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PhotoEntity]),
    StorageModule,
    ProjectsModule,
  ],
  controllers: [AssetsController, AssetsMultipartController, PhotosController, WorksController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
