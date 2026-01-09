import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustomerEntity } from "../database/entities/customer.entity";
import { CustomerResponseDto } from "./dto/customer-response.dto";

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  async findAll(): Promise<CustomerResponseDto[]> {
    const customers = await this.customerRepository.find({
      order: { createdAt: "DESC" },
    });
    return customers.map(CustomerResponseDto.fromEntity);
  }
}

