import { HealthController } from "./health.controller";

// 最小测试：确保 health 返回结构稳定（便于后续接入监控/探活）。
describe("HealthController", () => {
  it("returns ok", () => {
    const controller = new HealthController();
    expect(controller.health()).toEqual({ ok: true });
  });
});
