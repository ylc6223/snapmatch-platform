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

