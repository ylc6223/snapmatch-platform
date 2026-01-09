import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CustomerResponseDto } from "./dto/customer-response.dto";
import { QueryCustomersDto } from "./dto/query-customers.dto";

@ApiTags("客户管理")
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: "创建客户" })
  @ApiResponse({ status: 201, type: CustomerResponseDto })
  create(@Body() createCustomerDto: CreateCustomerDto): Promise<CustomerResponseDto> {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: "查询客户列表" })
  @ApiResponse({ status: 200, schema: {
    type: "object",
    properties: {
      items: { type: "array", items: { $ref: "#/components/schemas/CustomerResponseDto" } },
      total: { type: "number" },
      page: { type: "number" },
      pageSize: { type: "number" },
    }
  }})
  findAll(@Query() queryDto: QueryCustomersDto): Promise<{
    items: CustomerResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    return this.customersService.findAll(queryDto);
  }

  @Get(":id")
  @ApiOperation({ summary: "查询单个客户" })
  @ApiResponse({ status: 200, type: CustomerResponseDto })
  findOne(@Param("id") id: string): Promise<CustomerResponseDto> {
    return this.customersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "更新客户" })
  @ApiResponse({ status: 200, type: CustomerResponseDto })
  update(
    @Param("id") id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "删除客户" })
  @ApiResponse({ status: 204 })
  remove(@Param("id") id: string): Promise<void> {
    return this.customersService.remove(id);
  }
}
