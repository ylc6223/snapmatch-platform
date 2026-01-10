import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/api/backend";
import { isApiResponse, makeErrorResponse } from "@/lib/api/response";

export const runtime = "nodejs";

// API 内部使用的类型定义
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

/**
 * BFF：获取单个套餐详情
 *
 * 对接后端：
 * - GET `${BACKEND_BASE_URL}/api/v1/packages/:id`
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("[Package BFF] Fetching package:", id);

    // 调用后端获取套餐详情接口
    const result = await backendFetch<{ data: ApiPackage }>(
      `/api/v1/packages/${id}`
    );

    const pkg = result.data;
    if (!pkg) {
      return NextResponse.json(
        makeErrorResponse({ code: 502, message: "Bad Gateway" }),
        { status: 502 }
      );
    }

    console.log("[Package BFF] Package fetched successfully:", pkg.id);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("获取套餐详情失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({
          code: error.status,
          message: "获取套餐详情失败",
        }),
        { status: error.status }
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "获取套餐详情失败" }),
      { status: 500 }
    );
  }
}

/**
 * BFF：更新套餐
 *
 * 对接后端：
 * - PATCH `${BACKEND_BASE_URL}/api/v1/packages/:id`
 *
 * Request Body:
 * - name: 套餐名称（可选）
 * - description: 套餐描述（可选）
 * - includedRetouchCount: 包含精修张数（可选）
 * - includedAlbumCount: 包含入册张数（可选）
 * - includeAllOriginals: 是否底片全送（可选）
 * - price: 套餐价格（可选）
 * - extraRetouchPrice: 超额精修单价（可选）
 * - extraAlbumPrice: 超额入册单价（可选）
 * - isActive: 是否启用（可选）
 * - sort: 排序（可选）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log("[Package BFF] Updating package:", id);

    // 调用后端更新套餐接口
    const result = await backendFetch<{ data: ApiPackage }>(
      `/api/v1/packages/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const pkg = result.data;
    if (!pkg) {
      return NextResponse.json(
        makeErrorResponse({ code: 502, message: "Bad Gateway" }),
        { status: 502 }
      );
    }

    console.log("[Package BFF] Package updated successfully:", pkg.id);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("更新套餐失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({
          code: error.status,
          message: "更新套餐失败",
        }),
        { status: error.status }
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "更新套餐失败" }),
      { status: 500 }
    );
  }
}

/**
 * BFF：删除套餐
 *
 * 对接后端：
 * - DELETE `${BACKEND_BASE_URL}/api/v1/packages/:id`
 *
 * 注意：
 * - 如果套餐有关联的项目，无法删除
 * - 成功删除返回 204 No Content
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("[Package BFF] Deleting package:", id);

    // 调用后端删除套餐接口
    await backendFetch(`/api/v1/packages/${id}`, {
      method: "DELETE",
    });

    console.log("[Package BFF] Package deleted successfully:", id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("删除套餐失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({
          code: error.status,
          message: "删除套餐失败",
        }),
        { status: error.status }
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "删除套餐失败" }),
      { status: 500 }
    );
  }
}
