import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PackageEntity } from "../database/entities/package.entity";
import { PackagesController } from "./packages.controller";
import { PackagesService } from "./packages.service";

@Module({
  imports: [TypeOrmModule.forFeature([PackageEntity])],
  controllers: [PackagesController],
  providers: [PackagesService],
})
export class PackagesModule {}

