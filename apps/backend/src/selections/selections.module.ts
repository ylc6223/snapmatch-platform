import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SelectionEntity } from "../database/entities/selection.entity";
import { SelectionsService } from "./selections.service";

@Module({
  imports: [TypeOrmModule.forFeature([SelectionEntity])],
  providers: [SelectionsService],
  exports: [SelectionsService],
})
export class SelectionsModule {}
