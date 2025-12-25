"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
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
    }));
    const nodeEnv = config.get("NODE_ENV") ?? "development";
    const jwtSecret = config.get("JWT_SECRET") ?? "change-me";
    if (nodeEnv === "production" && (jwtSecret === "change-me" || jwtSecret.trim().length < 16)) {
        throw new Error("Invalid JWT_SECRET: must be set to a strong value in production");
    }
    const port = Number(config.get("PORT") ?? "3002");
    await app.listen(port);
}
void bootstrap();
//# sourceMappingURL=main.js.map