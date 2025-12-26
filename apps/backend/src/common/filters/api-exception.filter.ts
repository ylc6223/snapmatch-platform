import {
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";

import type { ApiResponse } from "../types/api-response";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickCodeMessage(value: unknown) {
  if (!isRecord(value)) return null;
  const code = value.code;
  const message = value.message;
  if (typeof code === "number" && typeof message === "string") return { code, message };
  return null;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly options: { includeDetail: boolean }) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();

      // 1) 若上游已返回标准结构 `{ code, message }`，则直接透传
      const picked = pickCodeMessage(responseBody);
      if (picked) {
        const body: ApiResponse<never> = {
          ...picked,
          timestamp: Date.now(),
        };
        // 这里不再附加 detail：避免对外响应出现重复嵌套（例如 detail 内又包含同样的 code/message/errors）。
        return res.status(status).json(body);
      }

      // 3) 其它 HttpException：尽量提取 message，其次给通用文案
      let message = "请求失败";
      if (typeof responseBody === "string") {
        message = responseBody;
      } else if (isRecord(responseBody) && typeof responseBody.message === "string") {
        message = responseBody.message;
      }

      const body: ApiResponse<never> = {
        code: status,
        message,
        timestamp: Date.now(),
      };
      // 这里不再附加 detail：对外响应严格遵循 envelope，调试信息请通过日志排查。
      return res.status(status).json(body);
    }

    // 未捕获异常：统一 500
    const body: ApiResponse<never> = {
      code: 500,
      message: "服务器错误",
      timestamp: Date.now(),
    };
    // 这里不再附加 detail：对外响应严格遵循 envelope，调试信息请通过日志排查。
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
