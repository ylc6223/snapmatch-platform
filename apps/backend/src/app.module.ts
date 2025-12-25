import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "./auth/guards/permissions.guard";
import { RolesGuard } from "./auth/guards/roles.guard";
import { HealthController } from "./health/health.controller";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    // 全局配置模块：读取 .env.local / .env，并提供 ConfigService 给全应用使用。
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    // 用户相关模块：当前为内存用户仓库（用于启动期管理员登录打通），后续可切换到 CloudBase 实现。
    UsersModule,
    // 鉴权与权限模块：JWT 签发/解析、登录接口、RBAC（角色/权限）能力。
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [
    // 全局 Guard 顺序：
    // 1) JwtAuthGuard：负责校验 Bearer Token 并注入 request.user（支持 @Public() 放行）
    // 2) RolesGuard：按 @Roles(...) 校验角色（admin 可兜底放行）
    // 3) PermissionsGuard：按 @Permissions(...) 校验权限（permissions 包含 "*" 可兜底放行）
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
