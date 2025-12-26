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

