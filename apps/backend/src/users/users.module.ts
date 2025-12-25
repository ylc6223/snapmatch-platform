import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { USERS_REPOSITORY, type UsersRepository } from "./users.repository";
import { CloudBaseUsersRepository } from "./users.repository.cloudbase";
import { InMemoryUsersRepository } from "./users.repository.memory";
import { UsersService } from "./users.service";

@Module({
  providers: [
    // 对外暴露用户查询能力（AuthService 依赖该服务）。
    UsersService,
    {
      // 通过环境变量选择用户仓库实现，便于后续平滑切换到 CloudBase。
      provide: USERS_REPOSITORY,
      inject: [ConfigService],
      useFactory: (config: ConfigService): UsersRepository => {
        const repo = (config.get<string>("USERS_REPOSITORY") ?? "memory").toLowerCase();
        if (repo === "cloudbase") return new CloudBaseUsersRepository(config);
        return new InMemoryUsersRepository(config);
      },
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
