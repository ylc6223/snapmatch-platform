"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUsersRepository = void 0;
const node_crypto_1 = require("node:crypto");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const types_1 = require("../auth/types");
class InMemoryUsersRepository {
    constructor(config) {
        this.config = config;
        this.usersByAccount = new Map();
        this.bootstrapPromise = this.bootstrapAdmin().catch(() => undefined);
    }
    async findByAccount(account) {
        await this.bootstrapPromise;
        return this.usersByAccount.get(account.toLowerCase()) ?? null;
    }
    async bootstrapAdmin() {
        const account = this.config.get("ADMIN_ACCOUNT") ?? this.config.get("ADMIN_EMAIL");
        if (!account)
            return;
        const normalized = account.toLowerCase();
        if (this.usersByAccount.has(normalized))
            return;
        const passwordHash = await this.resolveAdminPasswordHash();
        if (!passwordHash)
            return;
        this.usersByAccount.set(normalized, {
            id: (0, node_crypto_1.randomUUID)(),
            account: normalized,
            passwordHash,
            roles: [types_1.Role.Admin],
            permissions: ["*"],
        });
    }
    async resolveAdminPasswordHash() {
        const passwordHash = this.config.get("ADMIN_PASSWORD_HASH");
        if (passwordHash && passwordHash.trim().length > 0)
            return passwordHash.trim();
        const password = this.config.get("ADMIN_PASSWORD");
        if (!password || password.trim().length === 0)
            return null;
        return bcryptjs_1.default.hash(password.trim(), 10);
    }
}
exports.InMemoryUsersRepository = InMemoryUsersRepository;
//# sourceMappingURL=users.repository.memory.js.map