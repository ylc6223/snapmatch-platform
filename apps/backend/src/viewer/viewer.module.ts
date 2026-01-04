import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ViewerController } from "./viewer.controller";
import { ViewerService } from "./viewer.service";
import { ProjectEntity } from "../database/entities/project.entity";
import { PhotoEntity } from "../database/entities/photo.entity";
import { SelectionsModule } from "../selections/selections.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, PhotoEntity]),
    SelectionsModule,
  ],
  controllers: [ViewerController],
  providers: [ViewerService],
})
export class ViewerModule {}
