import type { Role } from "../auth/types";
import { UserStatus } from "../database/entities/rbac-user.entity";

// 用户领域模型（最小化）：用于认证与权限控制。
export type User = {
  id: string;
  account: string;
  passwordHash: string;
  roles: Role[];
  permissions: string[];
};

export type UserRoleInfo = {
  code: Role;
  name: string;
};

export type AdminUser = Omit<User, "passwordHash"> & {
  status: UserStatus;
};

export type ListUsersInput = {
  query?: string | null;
  status?: UserStatus | null;
  sortBy?: "account" | "status" | null;
  sortOrder?: "asc" | "desc" | null;
  page: number;
  pageSize: number;
};

export type ListUsersResult = {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateUserInput = {
  account: string;
  passwordHash: string;
  roleCodes: Role[];
  status: UserStatus;
};

export type UpdateUserInput = {
  id: string;
  passwordHash?: string | null;
  roleCodes?: Role[] | null;
  status?: UserStatus | null;
};

// 用户仓库接口：用于隔离存储层（MySQL/未来其它实现）。
export type UsersRepository = {
  findByAccount(account: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  listUsers(input: ListUsersInput): Promise<ListUsersResult>;
  listRoles(): Promise<UserRoleInfo[]>;
  createUser(input: CreateUserInput): Promise<AdminUser>;
  updateUser(input: UpdateUserInput): Promise<AdminUser | null>;
  disableUser(id: string): Promise<boolean>;
};

// 注入 Token：UsersService 通过该 token 获取具体仓库实现。
export const USERS_REPOSITORY = Symbol("USERS_REPOSITORY");
