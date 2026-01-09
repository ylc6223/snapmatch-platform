import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/api/backend";
import { isApiResponse, makeErrorResponse, type ApiResponse } from "@/lib/api/response";

export const runtime = "nodejs";

interface ApiCustomer {
  id: string;
  name: string;
  phone: string;
}

export async function GET(_request: NextRequest) {
  try {
    const result = await backendFetch<ApiResponse<ApiCustomer[]>>(`/api/v1/customers`);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("获取客户列表失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({ code: error.status, message: "获取客户列表失败" }),
        { status: error.status },
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "获取客户列表失败" }),
      { status: 500 },
    );
  }
}

