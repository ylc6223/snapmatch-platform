import { HealthController } from "./health.controller";

// 最小测试：确保 health 返回结构稳定（便于后续接入监控/探活）。
describe("HealthController", () => {
  it("returns health status with required fields", () => {
    const controller = new HealthController();
    const result = controller.health();

    expect(result).toHaveProperty('status', 'ok');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('uptime');
    expect(typeof result.timestamp).toBe('string');
    expect(typeof result.uptime).toBe('number');
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });
});
