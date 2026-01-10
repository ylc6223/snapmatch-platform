/**
 * 套餐数据类型定义
 */

export interface Package {
  id: string;
  name: string;
  description?: string;
  includedRetouchCount: number;
  includedAlbumCount: number;
  includeAllOriginals: boolean;
  price?: number;
  extraRetouchPrice: number;
  extraAlbumPrice: number;
  isActive: boolean;
  sort: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreatePackageInput {
  name: string;
  description?: string;
  includedRetouchCount: number;
  includedAlbumCount: number;
  includeAllOriginals: boolean;
  price?: number;
  extraRetouchPrice: number;
  extraAlbumPrice: number;
  isActive: boolean;
  sort: number;
}

export interface UpdatePackageInput {
  name?: string;
  description?: string;
  includedRetouchCount?: number;
  includedAlbumCount?: number;
  includeAllOriginals?: boolean;
  price?: number;
  extraRetouchPrice?: number;
  extraAlbumPrice?: number;
  isActive?: boolean;
  sort?: number;
}

export interface PackagesQueryParams {
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedPackagesResponse {
  items: Package[];
  total: number;
  page: number;
  pageSize: number;
}
