"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudbaseModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_sdk_1 = require("@cloudbase/node-sdk");
const cloudbase_constants_1 = require("./cloudbase.constants");
let CloudbaseModule = class CloudbaseModule {
};
exports.CloudbaseModule = CloudbaseModule;
exports.CloudbaseModule = CloudbaseModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: cloudbase_constants_1.CLOUDBASE_APP,
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const env = config.get("CLOUDBASE_ENV") ??
                        config.get("TCB_ENV") ??
                        config.get("ENV_ID");
                    const normalizedEnv = typeof env === "string" ? env.trim() : "";
                    if (!normalizedEnv) {
                        throw new Error([
                            "缺少 CloudBase 环境 ID：请在 apps/backend/.env.local 配置 CLOUDBASE_ENV=<环境ID>（或 TCB_ENV）。",
                            "开发环境约定：PORT=3002，ADMIN_ORIGIN=http://localhost:3001。",
                            "可参考 apps/backend/.env.example。",
                        ].join(" "));
                    }
                    const region = config.get("CLOUDBASE_REGION") ?? "ap-shanghai";
                    const secretId = config.get("CLOUDBASE_SECRET_ID");
                    const secretKey = config.get("CLOUDBASE_SECRET_KEY");
                    return (0, node_sdk_1.init)({
                        env: normalizedEnv,
                        region,
                        ...(secretId && secretKey ? { secretId, secretKey } : {}),
                    });
                },
            },
        ],
        exports: [cloudbase_constants_1.CLOUDBASE_APP],
    })
], CloudbaseModule);
//# sourceMappingURL=cloudbase.module.js.map