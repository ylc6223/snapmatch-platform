import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { init, type CloudBase } from "@cloudbase/node-sdk";
import { CLOUDBASE_APP } from "./cloudbase.constants";

@Module({
  providers: [
    {
      provide: CLOUDBASE_APP,
      inject: [ConfigService],
      useFactory: (config: ConfigService): CloudBase => {
        const env =
          config.get<string>("CLOUDBASE_ENV") ??
          config.get<string>("TCB_ENV") ??
          // cloudbaserc.json 使用 {{env.ENV_ID}} 占位时，可直接在本地环境变量提供 ENV_ID。
          config.get<string>("ENV_ID");
        const normalizedEnv = typeof env === "string" ? env.trim() : "";
        if (!normalizedEnv) {
          throw new Error(
            [
              "缺少 CloudBase 环境 ID：请在 apps/backend/.env.local 配置 CLOUDBASE_ENV=<环境ID>（或 TCB_ENV）。",
              "开发环境约定：PORT=3002，ADMIN_ORIGIN=http://localhost:3001。",
              "可参考 apps/backend/.env.example。",
            ].join(" "),
          );
        }

        const region = config.get<string>("CLOUDBASE_REGION") ?? "ap-shanghai";
        const secretId = config.get<string>("CLOUDBASE_SECRET_ID");
        const secretKey = config.get<string>("CLOUDBASE_SECRET_KEY");

        return init({
          env: normalizedEnv,
          region,
          ...(secretId && secretKey ? { secretId, secretKey } : {}),
        });
      },
    },
  ],
  exports: [CLOUDBASE_APP],
})
export class CloudbaseModule {}
