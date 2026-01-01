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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const users_repository_1 = require("./users.repository");
let UsersService = class UsersService {
    constructor(repo) {
        this.repo = repo;
    }
    findByAccount(account) {
        return this.repo.findByAccount(account);
    }
    findById(id) {
        return this.repo.findById(id);
    }
    listUsers(input) {
        return this.repo.listUsers(input);
    }
    listRoles() {
        return this.repo.listRoles();
    }
    async createUser(input) {
        const password = input.password.trim();
        if (password.length < 6) {
            throw new common_1.BadRequestException({ code: 400, message: "密码长度至少 6 位" });
        }
        try {
            const passwordHash = await bcryptjs_1.default.hash(password, 10);
            return await this.repo.createUser({ ...input, passwordHash });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (message === "ACCOUNT_EXISTS") {
                throw new common_1.ConflictException({ code: 409, message: "账号已存在" });
            }
            throw error;
        }
    }
    async updateUser(input) {
        const password = typeof input.password === "string" ? input.password.trim() : "";
        const passwordHash = password.length > 0 ? await bcryptjs_1.default.hash(password, 10) : null;
        return this.repo.updateUser({ ...input, passwordHash });
    }
    disableUser(id) {
        return this.repo.disableUser(id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(users_repository_1.USERS_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], UsersService);
//# sourceMappingURL=users.service.js.map