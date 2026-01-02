import { Module } from "@nestjs/common";
import { USERS_REPOSITORY } from "./users.repository";
import { UsersService } from "./users.service";
import { UsersAdminController } from "./users.admin.controller";
import { MysqlModule } from "../database/mysql.module";
import { MySqlUsersRepository } from "./users.repository.mysql";

@Module({
  imports: [MysqlModule],
  controllers: [UsersAdminController],
  providers: [
    // 对外暴露用户查询能力（AuthService 依赖该服务）。
    UsersService,
    {
      // 固定使用 MySQL 作为存储层。
      provide: USERS_REPOSITORY,
      useClass: MySqlUsersRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
