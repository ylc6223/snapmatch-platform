import { Inject, Injectable } from "@nestjs/common";
import { USERS_REPOSITORY, type User, type UsersRepository } from "./users.repository";

// 用户服务：对上层（Auth/业务模块）提供用户查询；底层由 UsersRepository 负责具体存储实现。
@Injectable()
export class UsersService {
  constructor(@Inject(USERS_REPOSITORY) private readonly repo: UsersRepository) {}

  // 目前仅提供按账号查找；后续可扩展为按 uid、手机号、openId 等查询。
  findByAccount(account: string): Promise<User | null> {
    return this.repo.findByAccount(account);
  }
}
