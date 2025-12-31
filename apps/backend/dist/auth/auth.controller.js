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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("./decorators/public.decorator");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const refresh_dto_1 = require("./dto/refresh.dto");
const logout_dto_1 = require("./dto/logout.dto");
const error_codes_1 = require("./error-codes");
const api_response_decorators_1 = require("../common/swagger/api-response.decorators");
const auth_login_response_dto_1 = require("./dto/auth-login-response.dto");
const auth_refresh_response_dto_1 = require("./dto/auth-refresh-response.dto");
const auth_me_response_dto_1 = require("./dto/auth-me-response.dto");
const api_response_dto_1 = require("../common/swagger/api-response.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(dto, request) {
        const ip = request.ip ?? null;
        const userAgent = request.headers["user-agent"] ?? null;
        const result = await this.authService.login(dto.account, dto.password, { ip, userAgent });
        if (!result) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.AUTH_ERROR_CODE.InvalidCredentials,
                message: "账号或密码错误",
            });
        }
        return result;
    }
    async refresh(dto) {
        const result = await this.authService.refresh(dto.refreshToken);
        if (!result) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.AUTH_ERROR_CODE.Unauthorized,
                message: "refresh token 无效或已过期",
            });
        }
        return result;
    }
    async logout(dto) {
        await this.authService.logoutByRefreshToken(dto.refreshToken);
        return null;
    }
    me(user) {
        if (!user) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.AUTH_ERROR_CODE.Unauthorized,
                message: "未登录",
            });
        }
        return { user };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: "员工登录", description: "账号密码登录，成功返回 access/refresh token 与用户信息。" }),
    (0, swagger_1.ApiBody)({
        type: login_dto_1.LoginDto,
        examples: {
            admin: {
                summary: "种子账号：admin",
                value: { account: "admin", password: "admin" },
            },
            photographer: {
                summary: "种子账号：photographer（默认同 admin 密码）",
                value: { account: "photographer", password: "admin" },
            },
            sales: {
                summary: "种子账号：sales（默认同 admin 密码）",
                value: { account: "sales", password: "admin" },
            },
        },
    }),
    (0, api_response_decorators_1.ApiOkEnvelope)(auth_login_response_dto_1.AuthLoginDataDto),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "账号或密码错误" }),
    (0, common_1.Post)("login"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: "续期 accessToken", description: "使用 refreshToken 换取新的 accessToken（会旋转 refreshToken）。" }),
    (0, swagger_1.ApiBody)({
        type: refresh_dto_1.RefreshDto,
        examples: {
            example: {
                summary: "示例（请替换为真实 refreshToken）",
                value: { refreshToken: "rt_example_please_replace" },
            },
        },
    }),
    (0, api_response_decorators_1.ApiOkEnvelope)(auth_refresh_response_dto_1.AuthRefreshDataDto),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "refresh token 无效或已过期" }),
    (0, common_1.Post)("refresh"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_dto_1.RefreshDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: "登出", description: "撤销 refreshToken 对应的会话；成功后该会话立即失效。" }),
    (0, swagger_1.ApiBody)({
        type: logout_dto_1.LogoutDto,
        examples: {
            example: {
                summary: "示例（请替换为真实 refreshToken）",
                value: { refreshToken: "rt_example_please_replace" },
            },
        },
    }),
    (0, api_response_decorators_1.ApiOkEnvelopeNullable)(api_response_dto_1.EmptyDto),
    (0, common_1.Post)("logout"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [logout_dto_1.LogoutDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "获取当前用户", description: "需要 Bearer accessToken，返回当前用户的 roles/permissions。" }),
    (0, api_response_decorators_1.ApiOkEnvelope)(auth_me_response_dto_1.AuthMeDataDto),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "未登录" }),
    (0, common_1.Get)("me"),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)("auth"),
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map