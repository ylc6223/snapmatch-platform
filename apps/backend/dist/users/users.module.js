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
const cloudbase_module_1 = require("../database/cloudbase.module");
const cloudbase_constants_1 = require("../database/cloudbase.constants");
const users_repository_1 = require("./users.repository");
const users_repository_cloudbase_1 = require("./users.repository.cloudbase");
const users_service_1 = require("./users.service");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [cloudbase_module_1.CloudbaseModule],
        providers: [
            users_service_1.UsersService,
            {
                provide: users_repository_1.USERS_REPOSITORY,
                inject: [config_1.ConfigService, cloudbase_constants_1.CLOUDBASE_APP],
                useFactory: (config, app) => new users_repository_cloudbase_1.CloudBaseUsersRepository(app.models, config),
            },
        ],
        exports: [users_service_1.UsersService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map