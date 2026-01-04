import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/api/backend";
import { isApiResponse, makeErrorResponse } from "@/lib/api/response";

export const runtime = "nodejs";

export interface SearchParams {
  query: string;
  limit?: number;
}

export interface SearchResult {
  id: string;
  name: string;
  customerName?: string;
  status: string;
  viewerUrl: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

/**
 * BFF：搜索项目（同源）
 *
 * 对接后端：
 * - GET `${BACKEND_BASE_URL}/api/v1/projects/search?query=xxx&limit=10`
 *
 * 说明：
 * - 支持按项目名称或客户名称模糊搜索
 * - 返回最多 10 条匹配结果
 * - 统一 envelope 响应格式
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = searchParams.get("limit");

    console.log("[Search BFF] Received request:", { query, limit, url: request.url });

    if (!query) {
      console.log("[Search BFF] Missing query parameter");
      return NextResponse.json(
        makeErrorResponse({ code: 400, message: "缺少搜索关键词" }),
        { status: 400 }
      );
    }

    // 构建后端 API URL
    const params = new URLSearchParams({
      query,
      ...(limit && { limit: limit.toString() }),
    });

    console.log("[Search BFF] Calling backend:", params.toString());

    // 调用后端搜索接口（auth=true：需要登录态）
    const result = await backendFetch<ApiResponse<SearchResponse>>(
      `/api/v1/projects/search?${params.toString()}`
    );

    // 从 envelope 中提取 data 字段
    const searchData = result.data;
    if (!searchData) {
      return NextResponse.json(
        makeErrorResponse({ code: 502, message: "Bad Gateway" }),
        { status: 502 }
      );
    }

    // 透传后端的 envelope 响应
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("搜索请求失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({
          code: error.status,
          message: "搜索失败",
        }),
        { status: error.status }
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "搜索失败" }),
      { status: 500 }
    );
  }
}
