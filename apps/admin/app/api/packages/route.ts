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
  includeAllOriginals: boolean;
  price?: number;
  extraRetouchPrice: number;
  extraAlbumPrice: number;
  isActive: boolean;
  sort: number;
  createdAt: number;
  updatedAt: number;
}

interface PaginatedPackagesResponse {
  items: ApiPackage[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * BFF：获取套餐列表
 *
 * 对接后端：
 * - GET `${BACKEND_BASE_URL}/api/v1/packages`
 *
 * Query Parameters:
 * - query: 搜索关键词（套餐名称）
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20，最大100）
 * - sortBy: 排序字段（sort, name, createdAt, updatedAt）
 * - sortOrder: 排序方向（asc, desc）
 *
 * 说明：
 * - 支持搜索、分页、排序
 * - 统一 envelope 响应格式
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = new URLSearchParams();

    // 转发查询参数
    const query = searchParams.get("q");
    if (query) queryParams.set("query", query);

    const page = searchParams.get("page");
    if (page) queryParams.set("page", page);

    const pageSize = searchParams.get("pageSize");
    if (pageSize) queryParams.set("pageSize", pageSize);

    const sortBy = searchParams.get("sortBy");
    if (sortBy) queryParams.set("sortBy", sortBy);

    const sortOrder = searchParams.get("sortOrder");
    if (sortOrder) queryParams.set("sortOrder", sortOrder);

    const queryString = queryParams.toString();
    const url = `/api/v1/packages${queryString ? `?${queryString}` : ""}`;

    console.log("[Packages BFF] Received request:", { url });

    // 调用后端套餐列表接口（auth=true：需要登录态）
    const result = await backendFetch<ApiResponse<PaginatedPackagesResponse>>(url);

    // 从 envelope 中提取 data 字段
    const data = result.data;
    if (!data) {
      return NextResponse.json(
        makeErrorResponse({ code: 502, message: "Bad Gateway" }),
        { status: 502 }
      );
    }

    console.log("[Packages BFF] Successfully fetched packages:", data.items.length);

    // 透传后端的 envelope 响应
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("获取套餐列表失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({
          code: error.status,
          message: "获取套餐列表失败",
        }),
        { status: error.status }
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "获取套餐列表失败" }),
      { status: 500 }
    );
  }
}

/**
 * BFF：创建套餐
 *
 * 对接后端：
 * - POST `${BACKEND_BASE_URL}/api/v1/packages`
 *
 * Request Body:
 * - name: 套餐名称（必填）
 * - description: 套餐描述（可选）
 * - includedRetouchCount: 包含精修张数（必填）
 * - includedAlbumCount: 包含入册张数（必填）
 * - includeAllOriginals: 是否底片全送（必填）
 * - price: 套餐价格（可选）
 * - extraRetouchPrice: 超额精修单价（必填）
 * - extraAlbumPrice: 超额入册单价（必填）
 * - isActive: 是否启用（必填）
 * - sort: 排序（必填）
 *
 * 说明：
 * - 创建新套餐
 * - 统一 envelope 响应格式
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[Packages BFF] Creating package:", { name: body.name });

    // 调用后端创建套餐接口（auth=true：需要登录态）
    const result = await backendFetch<ApiResponse<ApiPackage>>(`/api/v1/packages`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 从 envelope 中提取 data 字段
    const pkg = result.data;
    if (!pkg) {
      return NextResponse.json(
        makeErrorResponse({ code: 502, message: "Bad Gateway" }),
        { status: 502 }
      );
    }

    console.log("[Packages BFF] Package created successfully:", pkg.id);

    // 透传后端的 envelope 响应
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("创建套餐失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({
          code: error.status,
          message: "创建套餐失败",
        }),
        { status: error.status }
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "创建套餐失败" }),
      { status: 500 }
    );
  }
}

