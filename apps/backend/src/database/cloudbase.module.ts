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
        const env = config.get<string>("CLOUDBASE_ENV") ?? config.get<string>("TCB_ENV");
        if (!env) {
          throw new Error("Missing CLOUDBASE_ENV (or TCB_ENV) for CloudBase Node SDK init");
        }

        const region = config.get<string>("CLOUDBASE_REGION") ?? "ap-shanghai";
        const secretId = config.get<string>("CLOUDBASE_SECRET_ID");
        const secretKey = config.get<string>("CLOUDBASE_SECRET_KEY");

        return init({
          env,
          region,
          ...(secretId && secretKey ? { secretId, secretKey } : {}),
        });
      },
    },
  ],
  exports: [CLOUDBASE_APP],
})
export class CloudbaseModule {}

