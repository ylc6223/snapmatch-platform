/**
 * 项目状态枚举
 */
export enum ProjectStatus {
  PENDING = 'pending',                  // 待选片
  SELECTING = 'selecting',              // 选片中
  SUBMITTED = 'submitted',              // 已提交
  RETOUCHING = 'retouching',            // 修图中
  PENDING_CONFIRMATION = 'pending_confirmation', // 待确认
  DELIVERED = 'delivered',              // 已交付
  CANCELLED = 'cancelled',              // 已取消
}

/**
 * 项目类型定义
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  token: string;
  viewerUrl: string;
  expiresAt?: number;
  status: string;
  photoCount: number;
  createdAt: number;
  updatedAt: number;
  coverImageUrl?: string;
  customerName?: string;
  shootDate?: number;
}

/**
 * 创建项目 DTO
 */
export interface CreateProjectDto {
  name: string;
  description?: string;
  customerId: string;
  packageId: string;
  shootDate?: number;
  expiresAt?: number;
}

/**
 * 更新项目 DTO
 */
export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  expiresAt?: number;
  coverImage?: string;
  allowDownloadOriginal?: boolean;
  watermarkEnabled?: boolean;
  selectionDeadline?: number;
}

/**
 * 搜索项目 DTO
 */
export interface SearchProjectDto {
  query: string;
  limit?: number;
}

/**
 * 搜索结果项
 */
export interface SearchResultItem {
  id: string;
  name: string;
  customerName?: string;
  status: string;
  viewerUrl: string;
}

/**
 * 搜索响应
 */
export interface SearchResponse {
  results: SearchResultItem[];
  total: number;
}

/**
 * API 响应包装
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}
