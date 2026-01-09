import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PackageEntity } from "../database/entities/package.entity";
import { PackageResponseDto } from "./dto/package-response.dto";

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(PackageEntity)
    private readonly packageRepository: Repository<PackageEntity>,
  ) {}

  async findAll(): Promise<PackageResponseDto[]> {
    const packages = await this.packageRepository.find({
      order: { sort: "ASC", createdAt: "DESC" },
    });
    return packages.map(PackageResponseDto.fromEntity);
  }
}

