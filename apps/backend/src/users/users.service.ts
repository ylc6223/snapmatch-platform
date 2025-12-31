import { BadRequestException, ConflictException, Inject, Injectable } from "@nestjs/common";
import bcrypt from "bcryptjs";
import {
  USERS_REPOSITORY,
  type AdminUser,
  type CreateUserInput,
  type ListUsersInput,
  type ListUsersResult,
  type UpdateUserInput,
  type User,
  type UserRoleInfo,
  type UsersRepository,
} from "./users.repository";

// 用户服务：对上层（Auth/业务模块）提供用户查询；底层由 UsersRepository 负责具体存储实现。
@Injectable()
export class UsersService {
  constructor(@Inject(USERS_REPOSITORY) private readonly repo: UsersRepository) {}

  // 目前仅提供按账号查找；后续可扩展为按 uid、手机号、openId 等查询。
  findByAccount(account: string): Promise<User | null> {
    return this.repo.findByAccount(account);
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }

  listUsers(input: ListUsersInput): Promise<ListUsersResult> {
    return this.repo.listUsers(input);
  }

  listRoles(): Promise<UserRoleInfo[]> {
    return this.repo.listRoles();
  }

  async createUser(input: Omit<CreateUserInput, "passwordHash"> & { password: string }): Promise<AdminUser> {
    const password = input.password.trim();
    if (password.length < 6) {
      throw new BadRequestException({ code: 400, message: "密码长度至少 6 位" });
    }

    try {
      const passwordHash = await bcrypt.hash(password, 10);
      return await this.repo.createUser({ ...input, passwordHash });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === "ACCOUNT_EXISTS") {
        throw new ConflictException({ code: 409, message: "账号已存在" });
      }
      throw error;
    }
  }

  async updateUser(input: Omit<UpdateUserInput, "passwordHash"> & { password?: string | null }): Promise<AdminUser | null> {
    const password = typeof input.password === "string" ? input.password.trim() : "";
    const passwordHash = password.length > 0 ? await bcrypt.hash(password, 10) : null;
    return this.repo.updateUser({ ...input, passwordHash });
  }

  disableUser(id: string): Promise<boolean> {
    return this.repo.disableUser(id);
  }
}
