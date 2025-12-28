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
                    const env = config.get("CLOUDBASE_ENV") ?? config.get("TCB_ENV");
                    if (!env) {
                        throw new Error("Missing CLOUDBASE_ENV (or TCB_ENV) for CloudBase Node SDK init");
                    }
                    const region = config.get("CLOUDBASE_REGION") ?? "ap-shanghai";
                    const secretId = config.get("CLOUDBASE_SECRET_ID");
                    const secretKey = config.get("CLOUDBASE_SECRET_KEY");
                    return (0, node_sdk_1.init)({
                        env,
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