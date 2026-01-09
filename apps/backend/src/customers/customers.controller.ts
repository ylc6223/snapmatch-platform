import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CustomersService } from "./customers.service";
import { CustomerResponseDto } from "./dto/customer-response.dto";

@ApiTags("客户管理")
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: "查询客户列表" })
  @ApiResponse({ status: 200, type: [CustomerResponseDto] })
  findAll(): Promise<CustomerResponseDto[]> {
    return this.customersService.findAll();
  }
}

