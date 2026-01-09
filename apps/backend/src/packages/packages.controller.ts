import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PackagesService } from "./packages.service";
import { PackageResponseDto } from "./dto/package-response.dto";

@ApiTags("套餐管理")
@Controller("packages")
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @ApiOperation({ summary: "查询套餐列表" })
  @ApiResponse({ status: 200, type: [PackageResponseDto] })
  findAll(): Promise<PackageResponseDto[]> {
    return this.packagesService.findAll();
  }
}

