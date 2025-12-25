import { Controller, Get } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator";

// 健康检查接口：用于本地、部署平台探活与监控。
@Controller("health")
export class HealthController {
  // 公共接口：不需要 JWT。
  @Public()
  @Get()
  health() {
    return { ok: true };
  }
}
