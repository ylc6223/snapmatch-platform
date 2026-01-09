import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/api/backend";
import { isApiResponse, makeErrorResponse } from "@/lib/api/response";

export const runtime = "nodejs";

// API 内部使用的类型定义
interface ApiCustomer {
  id: string;
  name: string;
  phone: string;
  wechatOpenId?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

/**
 * BFF：获取单个客户详情
 *
 * 对接后端：
 * - GET `${BACKEND_BASE_URL}/api/v1/customers/:id`
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("[Customer BFF] Fetching customer:", id);

    // 调用后端获取客户详情接口
    const result = await backendFetch<ApiResponse<ApiCustomer>>(
      `/api/v1/customers/${id}`
    );

    const customer = result.data;
    if (!customer) {
      return NextResponse.json(
        makeErrorResponse({ code: 502, message: "Bad Gateway" }),
        { status: 502 }
      );
    }

    console.log("[Customer BFF] Customer fetched successfully:", customer.id);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("获取客户详情失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({
          code: error.status,
          message: "获取客户详情失败",
        }),
        { status: error.status }
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "获取客户详情失败" }),
      { status: 500 }
    );
  }
}

/**
 * BFF：更新客户
 *
 * 对接后端：
 * - PATCH `${BACKEND_BASE_URL}/api/v1/customers/:id`
 *
 * Request Body:
 * - name: 客户姓名（可选）
 * - phone: 手机号（可选）
 * - wechatOpenId: 微信OpenID（可选）
 * - email: 邮箱（可选）
 * - notes: 备注说明（可选）
 * - tags: 标签数组（可选）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log("[Customer BFF] Updating customer:", id);

    // 调用后端更新客户接口
    const result = await backendFetch<ApiResponse<ApiCustomer>>(
      `/api/v1/customers/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const customer = result.data;
    if (!customer) {
      return NextResponse.json(
        makeErrorResponse({ code: 502, message: "Bad Gateway" }),
        { status: 502 }
      );
    }

    console.log("[Customer BFF] Customer updated successfully:", customer.id);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("更新客户失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({
          code: error.status,
          message: "更新客户失败",
        }),
        { status: error.status }
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "更新客户失败" }),
      { status: 500 }
    );
  }
}

/**
 * BFF：删除客户
 *
 * 对接后端：
 * - DELETE `${BACKEND_BASE_URL}/api/v1/customers/:id`
 *
 * 注意：
 * - 如果客户有关联的项目，无法删除
 * - 成功删除返回 204 No Content
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("[Customer BFF] Deleting customer:", id);

    // 调用后端删除客户接口
    await backendFetch(`/api/v1/customers/${id}`, {
      method: "DELETE",
    });

    console.log("[Customer BFF] Customer deleted successfully:", id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("删除客户失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({
          code: error.status,
          message: "删除客户失败",
        }),
        { status: error.status }
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "删除客户失败" }),
      { status: 500 }
    );
  }
}
