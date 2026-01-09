import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { nanoid } from "nanoid";
import { CustomerEntity } from "../database/entities/customer.entity";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CustomerResponseDto } from "./dto/customer-response.dto";
import { QueryCustomersDto } from "./dto/query-customers.dto";

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  /**
   * 创建新客户
   */
  async create(createCustomerDto: CreateCustomerDto): Promise<CustomerResponseDto> {
    // 检查手机号是否已存在
    const existingCustomer = await this.customerRepository.findOne({
      where: { phone: createCustomerDto.phone },
    });

    if (existingCustomer) {
      throw new ConflictException(`手机号 ${createCustomerDto.phone} 已被使用`);
    }

    const customerId = `cus_${nanoid(16)}`;
    const now = Date.now();

    const customer = this.customerRepository.create({
      id: customerId,
      name: createCustomerDto.name,
      phone: createCustomerDto.phone,
      wechatOpenId: createCustomerDto.wechatOpenId || null,
      email: createCustomerDto.email || null,
      notes: createCustomerDto.notes || null,
      tags: createCustomerDto.tags || null,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.customerRepository.save(customer);

    return CustomerResponseDto.fromEntity(saved);
  }

  /**
   * 查询客户列表（分页、搜索）
   */
  async findAll(queryDto: QueryCustomersDto): Promise<{
    items: CustomerResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { query, page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc" } = queryDto;

    // 构建查询条件
    const where = query
      ? [
          { name: Like(`%${query}%`) },
          { phone: Like(`%${query}%`) },
        ]
      : {};

    // 计算 skip 和 take
    const skip = (page - 1) * pageSize;

    // 执行查询
    const [customers, total] = await this.customerRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder === "asc" ? "ASC" : "DESC" },
      skip,
      take: pageSize,
    });

    // 转换为 DTO
    const items = customers.map((customer) => CustomerResponseDto.fromEntity(customer));

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 查询单个客户
   */
  async findOne(id: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException(`客户 ${id} 不存在`);
    }

    return CustomerResponseDto.fromEntity(customer);
  }

  /**
   * 更新客户
   */
  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException(`客户 ${id} 不存在`);
    }

    // 如果更新手机号，检查是否与其他客户冲突
    if (updateCustomerDto.phone && updateCustomerDto.phone !== customer.phone) {
      const existingCustomer = await this.customerRepository.findOne({
        where: { phone: updateCustomerDto.phone },
      });

      if (existingCustomer) {
        throw new ConflictException(`手机号 ${updateCustomerDto.phone} 已被使用`);
      }
    }

    // 更新字段
    Object.assign(customer, updateCustomerDto, { updatedAt: Date.now() });

    const saved = await this.customerRepository.save(customer);

    return CustomerResponseDto.fromEntity(saved);
  }

  /**
   * 删除客户
   */
  async remove(id: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ["projects"], // 检查是否有关联的项目
    });

    if (!customer) {
      throw new NotFoundException(`客户 ${id} 不存在`);
    }

    // 检查是否有关联的项目
    if (customer.projects && customer.projects.length > 0) {
      throw new ConflictException(
        `无法删除客户：该客户下还有 ${customer.projects.length} 个项目`
      );
    }

    await this.customerRepository.remove(customer);
  }
}
