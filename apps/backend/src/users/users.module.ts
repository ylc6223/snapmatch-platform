import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CloudbaseModule } from "../database/cloudbase.module";
import { CLOUDBASE_APP } from "../database/cloudbase.constants";
import { USERS_REPOSITORY, type UsersRepository } from "./users.repository";
import { CloudBaseUsersRepository } from "./users.repository.cloudbase";
import { UsersService } from "./users.service";
import type { CloudBase } from "@cloudbase/node-sdk";
import { UsersAdminController } from "./users.admin.controller";

@Module({
  imports: [CloudbaseModule],
  controllers: [UsersAdminController],
  providers: [
    // 对外暴露用户查询能力（AuthService 依赖该服务）。
    UsersService,
    {
      // 固定使用 CloudBase 数据模型作为存储层。
      provide: USERS_REPOSITORY,
      inject: [ConfigService, CLOUDBASE_APP],
      useFactory: (config: ConfigService, app: CloudBase): UsersRepository =>
        new CloudBaseUsersRepository(app.models, config),
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
