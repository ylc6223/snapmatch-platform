import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from "@nestjs/common";
import { map } from "rxjs/operators";
import type { Observable } from "rxjs";
import type { ApiResponse } from "../types/api-response";

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<unknown>> {
    return next.handle().pipe(
      map((data) => ({
        code: 200,
        message: "success",
        data,
        timestamp: Date.now(),
      })),
    );
  }
}

