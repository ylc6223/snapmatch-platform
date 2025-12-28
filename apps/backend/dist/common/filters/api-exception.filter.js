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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function pickCodeMessage(value) {
    if (!isRecord(value))
        return null;
    const code = value.code;
    const message = value.message;
    if (typeof code === "number" && typeof message === "string")
        return { code, message };
    return null;
}
let ApiExceptionFilter = class ApiExceptionFilter {
    constructor(options) {
        this.options = options;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const responseBody = exception.getResponse();
            const picked = pickCodeMessage(responseBody);
            if (picked) {
                const body = {
                    ...picked,
                    timestamp: Date.now(),
                };
                return res.status(status).json(body);
            }
            let message = "请求失败";
            if (typeof responseBody === "string") {
                message = responseBody;
            }
            else if (isRecord(responseBody) && typeof responseBody.message === "string") {
                message = responseBody.message;
            }
            const body = {
                code: status,
                message,
                timestamp: Date.now(),
            };
            return res.status(status).json(body);
        }
        const body = {
            code: 500,
            message: "服务器错误",
            timestamp: Date.now(),
        };
        return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json(body);
    }
};
exports.ApiExceptionFilter = ApiExceptionFilter;
exports.ApiExceptionFilter = ApiExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [Object])
], ApiExceptionFilter);
//# sourceMappingURL=api-exception.filter.js.map