import "reflect-metadata";
import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { ResponseEnvelopeInterceptor } from "./common/interceptors/response-envelope.interceptor";
import type { ApiErrorItem } from "./common/types/api-response";

async function bootstrap() {
  // 创建 Nest 应用实例（关闭默认 CORS，下面会按配置显式开启并限制来源）。
  const app = await NestFactory.create(AppModule, { cors: false });
  // 统一读取 ConfigModule 加载的环境变量。
  const config = app.get(ConfigService);

  // 默认只允许 Admin 前端来源，减少 CORS 暴露面（也更利于后续按角色/端区分来源）。
  const adminOrigin = config.get<string>("ADMIN_ORIGIN") ?? "http://localhost:3001";
  app.enableCors({
    origin: [adminOrigin],
    credentials: true,
  });

  // 全局入参校验（配合 DTO 的 class-validator）：
  // - whitelist：剔除未声明字段
  // - forbidNonWhitelisted：请求包含未知字段时直接报错
  // - transform：将 payload 转成 DTO 实例，并尽可能做类型转换
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory(errors) {
        const formatted: ApiErrorItem[] = [];
        for (const e of errors) {
          const field = e.property;
          const constraints = e.constraints ?? {};
          for (const reason of Object.values(constraints)) {
            formatted.push({ field, reason });
          }
        }
        return new BadRequestException({
          code: 400,
          message: "Validation Failed",
          errors: formatted,
        });
      },
    }),
  );

  // 生产环境强校验 JWT 密钥，避免使用默认值或过弱密钥导致安全风险。
  const nodeEnv = config.get<string>("NODE_ENV") ?? "development";
  const jwtSecret = config.get<string>("JWT_SECRET") ?? "change-me";
  if (nodeEnv === "production" && (jwtSecret === "change-me" || jwtSecret.trim().length < 16)) {
    throw new Error("Invalid JWT_SECRET: must be set to a strong value in production");
  }

  // 统一错误响应结构：始终输出 `{ code, message, errors?, timestamp }`（严格 envelope，不对外暴露 detail）。
  app.useGlobalFilters(new ApiExceptionFilter({ includeDetail: false }));
  // 统一成功响应结构：输出 `{ code, message, data, timestamp }`。
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  // 监听端口：本地默认 3002；容器/CloudRun 部署时通常由平台注入 PORT。
  const port = Number(config.get<string>("PORT") ?? "3002");
  await app.listen(port);
}

void bootstrap();
