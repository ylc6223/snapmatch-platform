import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/api/backend";
import { isApiResponse, makeErrorResponse, type ApiResponse } from "@/lib/api/response";

export const runtime = "nodejs";

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

interface PaginatedCustomersResponse {
  items: ApiCustomer[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * BFF：获取客户列表
 *
 * 对接后端：
 * - GET `${BACKEND_BASE_URL}/api/v1/customers`
 *
 * Query Parameters:
 * - query: 搜索关键词（姓名或手机号）
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20，最大100）
 * - sortBy: 排序字段（createdAt, updatedAt, name）
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
    const url = `/api/v1/customers${queryString ? `?${queryString}` : ""}`;

    console.log("[Customers BFF] Received request:", { url });

    // 调用后端客户列表接口（auth=true：需要登录态）
    const result = await backendFetch<ApiResponse<PaginatedCustomersResponse>>(url);

    // 从 envelope 中提取 data 字段
    const data = result.data;
    if (!data) {
      return NextResponse.json(
        makeErrorResponse({ code: 502, message: "Bad Gateway" }),
        { status: 502 }
      );
    }

    console.log("[Customers BFF] Successfully fetched customers:", data.items.length);

    // 透传后端的 envelope 响应
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("获取客户列表失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({
          code: error.status,
          message: "获取客户列表失败",
        }),
        { status: error.status }
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "获取客户列表失败" }),
      { status: 500 }
    );
  }
}

/**
 * BFF：创建客户
 *
 * 对接后端：
 * - POST `${BACKEND_BASE_URL}/api/v1/customers`
 *
 * Request Body:
 * - name: 客户姓名（必填）
 * - phone: 手机号（必填）
 * - wechatOpenId: 微信OpenID（可选）
 * - email: 邮箱（可选）
 * - notes: 备注说明（可选）
 * - tags: 标签数组（可选）
 *
 * 说明：
 * - 创建新客户档案
 * - 检查手机号唯一性
 * - 统一 envelope 响应格式
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[Customers BFF] Creating customer:", { name: body.name, phone: body.phone });

    // 调用后端创建客户接口（auth=true：需要登录态）
    const result = await backendFetch<ApiResponse<ApiCustomer>>(`/api/v1/customers`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 从 envelope 中提取 data 字段
    const customer = result.data;
    if (!customer) {
      return NextResponse.json(
        makeErrorResponse({ code: 502, message: "Bad Gateway" }),
        { status: 502 }
      );
    }

    console.log("[Customers BFF] Customer created successfully:", customer.id);

    // 透传后端的 envelope 响应
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("创建客户失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({
          code: error.status,
          message: "创建客户失败",
        }),
        { status: error.status }
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "创建客户失败" }),
      { status: 500 }
    );
  }
}
