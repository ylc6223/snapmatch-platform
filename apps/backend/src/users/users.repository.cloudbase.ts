import type { ConfigService } from "@nestjs/config";
import type { UsersRepository } from "./users.repository";

export class CloudBaseUsersRepository implements UsersRepository {
  // CloudBase 用户仓库（占位）：
  // - 后续接入 CloudBase Auth / 数据库后，实现真实的用户查询逻辑
  // - 当 ready 后，将 USERS_REPOSITORY=cloudbase 作为切换开关即可
  constructor(private readonly config: ConfigService) {
    void this.config;
  }

  async findByAccount(): Promise<null> {
    // 显式抛错：防止误以为已完成 CloudBase 接入。
    throw new Error("CloudBaseUsersRepository is not implemented yet");
  }
}
