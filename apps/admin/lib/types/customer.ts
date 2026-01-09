/**
 * 客户数据类型定义
 */

export interface Customer {
  id: string;
  name: string;
  phone: string;
  wechatOpenId?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  wechatOpenId?: string;
  email?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  wechatOpenId?: string;
  email?: string;
  notes?: string;
  tags?: string[];
}

export interface CustomersQueryParams {
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedCustomersResponse {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}
