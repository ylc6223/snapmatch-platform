"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const users_repository_1 = require("./users.repository");
const users_repository_cloudbase_1 = require("./users.repository.cloudbase");
const users_repository_memory_1 = require("./users.repository.memory");
const users_service_1 = require("./users.service");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        providers: [
            users_service_1.UsersService,
            {
                provide: users_repository_1.USERS_REPOSITORY,
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const repo = (config.get("USERS_REPOSITORY") ?? "memory").toLowerCase();
                    if (repo === "cloudbase")
                        return new users_repository_cloudbase_1.CloudBaseUsersRepository(config);
                    return new users_repository_memory_1.InMemoryUsersRepository(config);
                },
            },
        ],
        exports: [users_service_1.UsersService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map