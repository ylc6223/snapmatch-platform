/**
 * 标准 API 响应 envelope（apps/admin 与 apps/backend 约定一致）
 *
 * - 成功：{ code, message, data, timestamp }
 * - 失败：{ code, message, errors?, timestamp }
 *
 * 前端建议按 HTTP status 处理通用策略（例如 401 跳转登录、403 提示无权限），
 * 展示层再使用 message/errors 做用户可读提示。
 */
export type ApiErrorItem = {
  field: string;
  reason: string;
};

export type ApiResponse<T> = {
  code: number;
  message: string;
  data?: T;
  errors?: ApiErrorItem[];
  timestamp: number;
};

export function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.code === "number" && typeof v.message === "string" && typeof v.timestamp === "number";
}

export function makeErrorResponse(input: {
  code: number;
  message: string;
  errors?: ApiErrorItem[];
}): ApiResponse<never> {
  return {
    code: input.code,
    message: input.message,
    errors: input.errors,
    timestamp: Date.now(),
  };
}
