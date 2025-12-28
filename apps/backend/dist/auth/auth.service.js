"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const users_service_1 = require("../users/users.service");
const auth_sessions_service_1 = require("./sessions/auth-sessions.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, config, sessions) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.config = config;
        this.sessions = sessions;
    }
    async login(account, password, meta) {
        const debugAuth = (this.config.get("AUTH_DEBUG") ?? "").toLowerCase() === "true";
        const user = await this.usersService.findByAccount(account);
        if (debugAuth) {
            console.log("[auth] login attempt", { account, userFound: Boolean(user) });
        }
        if (!user)
            return null;
        const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (debugAuth) {
            console.log("[auth] password compare", { account: user.account, ok });
        }
        if (!ok)
            return null;
        const { sessionId, refreshToken, expiresAt } = await this.sessions.createSession({
            userId: user.id,
            ip: meta?.ip ?? null,
            userAgent: meta?.userAgent ?? null,
        });
        const payload = {
            sub: user.id,
            account: user.account,
            roles: user.roles,
            permissions: user.permissions,
            sid: sessionId,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        const authUser = {
            id: user.id,
            account: user.account,
            roles: user.roles,
            permissions: user.permissions,
        };
        return { accessToken, refreshToken, refreshExpiresAt: expiresAt.getTime(), user: authUser };
    }
    async refresh(refreshToken) {
        const rotated = await this.sessions.rotateByRefreshToken(refreshToken);
        if (!rotated)
            return null;
        const user = await this.usersService.findById(rotated.userId);
        if (!user) {
            await this.sessions.revokeBySessionId(rotated.sessionId);
            return null;
        }
        const payload = {
            sub: user.id,
            account: user.account,
            roles: user.roles,
            permissions: user.permissions,
            sid: rotated.sessionId,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
            accessToken,
            refreshToken: rotated.refreshToken,
            refreshExpiresAt: rotated.expiresAt.getTime(),
        };
    }
    logoutBySessionId(sessionId) {
        return this.sessions.revokeBySessionId(sessionId);
    }
    logoutByRefreshToken(refreshToken) {
        return this.sessions.revokeByRefreshToken(refreshToken);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        auth_sessions_service_1.AuthSessionsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map