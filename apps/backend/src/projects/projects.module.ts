import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectsService } from "./projects.service";
import { ProjectsController } from "./projects.controller";
import { ProjectEntity } from "../database/entities/project.entity";
import { CustomerEntity } from "../database/entities/customer.entity";
import { PackageEntity } from "../database/entities/package.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEntity, CustomerEntity, PackageEntity])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
