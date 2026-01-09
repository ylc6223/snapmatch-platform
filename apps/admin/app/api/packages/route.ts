import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/api/backend";
import { isApiResponse, makeErrorResponse, type ApiResponse } from "@/lib/api/response";

export const runtime = "nodejs";

interface ApiPackage {
  id: string;
  name: string;
  description?: string;
  includedRetouchCount: number;
  includedAlbumCount: number;
  price?: number;
  isActive: boolean;
  sort: number;
}

export async function GET(_request: NextRequest) {
  try {
    const result = await backendFetch<ApiResponse<ApiPackage[]>>(`/api/v1/packages`);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("获取套餐列表失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({ code: error.status, message: "获取套餐列表失败" }),
        { status: error.status },
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "获取套餐列表失败" }),
      { status: 500 },
    );
  }
}

