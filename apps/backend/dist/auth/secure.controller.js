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
exports.SecureController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("./decorators/permissions.decorator");
const roles_decorator_1 = require("./decorators/roles.decorator");
const types_1 = require("./types");
let SecureController = class SecureController {
    adminOnly() {
        return { ok: true, scope: "admin" };
    }
    photographerOnly() {
        return { ok: true, scope: "photographer" };
    }
    needsPermission() {
        return { ok: true, permission: "packages:write" };
    }
};
exports.SecureController = SecureController;
__decorate([
    (0, roles_decorator_1.Roles)(types_1.Role.Admin),
    (0, common_1.Get)("admin-only"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SecureController.prototype, "adminOnly", null);
__decorate([
    (0, roles_decorator_1.Roles)(types_1.Role.Photographer),
    (0, common_1.Get)("photographer-only"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SecureController.prototype, "photographerOnly", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("packages:write"),
    (0, common_1.Get)("needs-permission"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SecureController.prototype, "needsPermission", null);
exports.SecureController = SecureController = __decorate([
    (0, common_1.Controller)("secure")
], SecureController);
//# sourceMappingURL=secure.controller.js.map