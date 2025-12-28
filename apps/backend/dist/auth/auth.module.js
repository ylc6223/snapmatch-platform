"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const users_module_1 = require("../users/users.module");
const cloudbase_module_1 = require("../database/cloudbase.module");
const cloudbase_constants_1 = require("../database/cloudbase.constants");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const secure_controller_1 = require("./secure.controller");
const auth_sessions_repository_1 = require("./sessions/auth-sessions.repository");
const auth_sessions_repository_cloudbase_1 = require("./sessions/auth-sessions.repository.cloudbase");
const auth_sessions_service_1 = require("./sessions/auth-sessions.service");
function parseJwtExpiresInToSeconds(value) {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed))
        return Number(trimmed);
    const match = /^(\d+)(s|m|h|d|w)$/.exec(trimmed);
    if (!match)
        throw new Error(`Invalid JWT_EXPIRES_IN: ${value}`);
    const amount = Number(match[1]);
    const unit = match[2];
    const secondsPerUnit = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 60 * 60 * 24,
        w: 60 * 60 * 24 * 7,
    };
    return amount * secondsPerUnit[unit];
}
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            cloudbase_module_1.CloudbaseModule,
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get("JWT_SECRET") ?? "change-me",
                    signOptions: {
                        expiresIn: parseJwtExpiresInToSeconds(config.get("JWT_EXPIRES_IN") ?? "12h"),
                    },
                }),
            }),
        ],
        controllers: [auth_controller_1.AuthController, secure_controller_1.SecureController],
        providers: [
            auth_service_1.AuthService,
            {
                provide: auth_sessions_repository_1.AUTH_SESSIONS_REPOSITORY,
                inject: [config_1.ConfigService, cloudbase_constants_1.CLOUDBASE_APP],
                useFactory: (config, app) => new auth_sessions_repository_cloudbase_1.CloudBaseAuthSessionsRepository(app.models, config),
            },
            auth_sessions_service_1.AuthSessionsService,
            jwt_strategy_1.JwtStrategy,
        ],
        exports: [auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map