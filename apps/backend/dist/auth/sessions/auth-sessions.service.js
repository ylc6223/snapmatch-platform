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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSessionsService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_sessions_repository_1 = require("./auth-sessions.repository");
function sha256Hex(input) {
    return (0, node_crypto_1.createHash)("sha256").update(input).digest("hex");
}
function base64Url(bytes) {
    return bytes
        .toString("base64")
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");
}
let AuthSessionsService = class AuthSessionsService {
    constructor(repo, config) {
        this.repo = repo;
        this.config = config;
    }
    getRefreshTtlDays() {
        const days = Number(this.config.get("AUTH_REFRESH_TOKEN_TTL_DAYS") ?? "30");
        return Number.isFinite(days) && days > 0 ? days : 30;
    }
    generateRefreshToken() {
        return `rt_${base64Url((0, node_crypto_1.randomBytes)(32))}`;
    }
    hashRefreshToken(refreshToken) {
        return sha256Hex(refreshToken);
    }
    computeExpiresAt() {
        const days = this.getRefreshTtlDays();
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
    async createSession(input) {
        const refreshToken = this.generateRefreshToken();
        const refreshTokenHash = this.hashRefreshToken(refreshToken);
        const expiresAt = this.computeExpiresAt();
        const session = await this.repo.create({
            userId: input.userId,
            refreshTokenHash,
            expiresAt,
            ip: input.ip ?? null,
            userAgent: input.userAgent ?? null,
        });
        return { sessionId: session.id, refreshToken, expiresAt };
    }
    async rotateByRefreshToken(refreshToken) {
        const refreshTokenHash = this.hashRefreshToken(refreshToken);
        const session = await this.repo.findByRefreshTokenHash(refreshTokenHash);
        if (!session)
            return null;
        const now = Date.now();
        if (session.revokedAt)
            return null;
        if (new Date(session.expiresAt).getTime() <= now)
            return null;
        const nextRefreshToken = this.generateRefreshToken();
        const nextRefreshTokenHash = this.hashRefreshToken(nextRefreshToken);
        const nextExpiresAt = this.computeExpiresAt();
        await this.repo.rotateRefreshToken(session.id, nextRefreshTokenHash, nextExpiresAt);
        await this.repo.touch(session.id);
        return {
            sessionId: session.id,
            userId: session.userId,
            refreshToken: nextRefreshToken,
            expiresAt: nextExpiresAt,
        };
    }
    async revokeByRefreshToken(refreshToken) {
        const refreshTokenHash = this.hashRefreshToken(refreshToken);
        const session = await this.repo.findByRefreshTokenHash(refreshTokenHash);
        if (!session)
            return false;
        await this.repo.revoke(session.id);
        return true;
    }
    revokeBySessionId(sessionId) {
        return this.repo.revoke(sessionId);
    }
    revokeAllByUserId(userId) {
        return this.repo.revokeByUserId(userId);
    }
    isSessionActive(sessionId) {
        return this.repo.isActive(sessionId);
    }
};
exports.AuthSessionsService = AuthSessionsService;
exports.AuthSessionsService = AuthSessionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(auth_sessions_repository_1.AUTH_SESSIONS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], AuthSessionsService);
//# sourceMappingURL=auth-sessions.service.js.map