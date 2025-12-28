"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const node_os_1 = __importDefault(require("node:os"));
const app_module_1 = require("./app.module");
const api_exception_filter_1 = require("./common/filters/api-exception.filter");
const response_envelope_interceptor_1 = require("./common/interceptors/response-envelope.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: false });
    const config = app.get(config_1.ConfigService);
    const adminOrigin = config.get("ADMIN_ORIGIN") ?? "http://localhost:3001";
    app.enableCors({
        origin: [adminOrigin],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory(errors) {
            const formatted = [];
            for (const e of errors) {
                const field = e.property;
                const constraints = e.constraints ?? {};
                for (const reason of Object.values(constraints)) {
                    formatted.push({ field, reason });
                }
            }
            return new common_1.BadRequestException({
                code: 400,
                message: "Validation Failed",
                errors: formatted,
            });
        },
    }));
    const nodeEnv = config.get("NODE_ENV") ?? "development";
    const jwtSecret = config.get("JWT_SECRET") ?? "change-me";
    if (nodeEnv === "production" && (jwtSecret === "change-me" || jwtSecret.trim().length < 16)) {
        throw new Error("Invalid JWT_SECRET: must be set to a strong value in production");
    }
    app.useGlobalFilters(new api_exception_filter_1.ApiExceptionFilter({ includeDetail: false }));
    app.useGlobalInterceptors(new response_envelope_interceptor_1.ResponseEnvelopeInterceptor());
    const port = Number(config.get("PORT") ?? "3002");
    await app.listen(port);
    const protocol = "http";
    const localUrl = `${protocol}://localhost:${port}`;
    const networks = node_os_1.default.networkInterfaces();
    const networkUrls = Object.values(networks)
        .flat()
        .filter((item) => Boolean(item))
        .filter((item) => item.family === "IPv4" && !item.internal)
        .map((item) => `${protocol}://${item.address}:${port}`);
    console.log("");
    console.log("  ▲ NestJS");
    console.log(`   - Local:         ${localUrl}`);
    if (networkUrls.length > 0) {
        console.log(`   - Network:       ${networkUrls[0]}`);
    }
}
void bootstrap();
//# sourceMappingURL=main.js.map