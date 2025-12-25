import { randomUUID } from "node:crypto";
import type { ConfigService } from "@nestjs/config";
import bcrypt from "bcryptjs";
import { Role } from "../auth/types";
import type { User, UsersRepository } from "./users.repository";

  // 内存用户仓库（启动期临时方案）：
  // - 通过 ADMIN_ACCOUNT / ADMIN_PASSWORD_HASH（或 ADMIN_PASSWORD）引导生成一个管理员账号
  // - 仅用于本地/早期阶段跑通登录与 RBAC，后续会被 CloudBase 实现替代
export class InMemoryUsersRepository implements UsersRepository {
  private readonly usersByAccount = new Map<string, User>();
  private readonly bootstrapPromise: Promise<void>;

  constructor(private readonly config: ConfigService) {
    // 启动时尝试引导创建管理员用户（异步），查询前会 await 确保可用。
    this.bootstrapPromise = this.bootstrapAdmin().catch(() => undefined);
  }

  async findByAccount(account: string): Promise<User | null> {
    await this.bootstrapPromise;
    return this.usersByAccount.get(account.toLowerCase()) ?? null;
  }

  private async bootstrapAdmin() {
    const account = this.config.get<string>("ADMIN_ACCOUNT") ?? this.config.get<string>("ADMIN_EMAIL");
    if (!account) return;

    const normalized = account.toLowerCase();
    if (this.usersByAccount.has(normalized)) return;

    const passwordHash = await this.resolveAdminPasswordHash();
    if (!passwordHash) return;

    this.usersByAccount.set(normalized, {
      id: randomUUID(),
      account: normalized,
      passwordHash,
      roles: [Role.Admin],
      permissions: ["*"],
    });
  }

  private async resolveAdminPasswordHash(): Promise<string | null> {
    // 推荐：直接配置 ADMIN_PASSWORD_HASH（通过 scripts/hash-password.ts 生成）。
    const passwordHash = this.config.get<string>("ADMIN_PASSWORD_HASH");
    if (passwordHash && passwordHash.trim().length > 0) return passwordHash.trim();

    // 兼容：如果只提供明文 ADMIN_PASSWORD，则启动时动态 hash（不建议生产环境使用）。
    const password = this.config.get<string>("ADMIN_PASSWORD");
    if (!password || password.trim().length === 0) return null;

    return bcrypt.hash(password.trim(), 10);
  }
}
