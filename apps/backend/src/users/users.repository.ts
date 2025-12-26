import type { Role } from "../auth/types";

// 用户领域模型（最小化）：用于认证与权限控制。
export type User = {
  id: string;
  account: string;
  passwordHash: string;
  roles: Role[];
  permissions: string[];
};

// 用户仓库接口：用于隔离存储层（CloudBase 数据模型/未来其它实现）。
export type UsersRepository = {
  findByAccount(account: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
};

// 注入 Token：UsersService 通过该 token 获取具体仓库实现。
export const USERS_REPOSITORY = Symbol("USERS_REPOSITORY");
