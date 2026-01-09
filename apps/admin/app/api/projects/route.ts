import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/api/backend";
import { isApiResponse, makeErrorResponse } from "@/lib/api/response";

export const runtime = "nodejs";

// API 内部使用的类型定义（不导出，避免客户端导入服务端代码）
interface ApiProject {
  id: string;
  name: string;
  description?: string;
  token: string;
  viewerUrl: string;
  expiresAt?: number;
  status: string;
  photoCount: number;
  createdAt: number;
  updatedAt: number;
  coverImageUrl?: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

/**
 * BFF：创建新项目
 *
 * 对接后端：
 * - POST `${BACKEND_BASE_URL}/api/v1/projects`
 *
 * 说明：
 * - 创建新项目
 * - 必须提供 customerId 和 packageId
 * - TODO: 客户和套餐列表应从 API 获取
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[Projects BFF] Received POST request");

    const body = await request.json();
    console.log("[Projects BFF] Request body:", body);

    // 前后端字段保持一致：只接收后端 CreateProjectDto 支持的字段。
    // 当前后端尚未支持 coverImageUrl，这里直接丢弃，避免触发后端 whitelist 校验失败。
    const { coverImageUrl: _coverImageUrl, ...rest } = body ?? {};
    const payload = {
      name: rest.name,
      description: rest.description,
      customerId: rest.customerId,
      packageId: rest.packageId,
      shootDate: rest.shootDate,
      expiresAt: rest.expiresAt,
    };

    // 验证必填字段
    if (!payload.customerId || !payload.packageId) {
      return NextResponse.json(
        makeErrorResponse({
          code: 400,
          message: "客户和套餐为必填项",
        }),
        { status: 400 }
      );
    }

    if (payload.shootDate !== undefined && !(typeof payload.shootDate === "number" && Number.isFinite(payload.shootDate))) {
      return NextResponse.json(
        makeErrorResponse({
          code: 400,
          message: "shootDate 必须为毫秒时间戳（number）",
        }),
        { status: 400 }
      );
    }

    // 调用后端创建接口
    const result = await backendFetch<ApiResponse<ApiProject>>(
      `/api/v1/projects`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    console.log("[Projects BFF] Project created successfully:", result.data);

    // 透传后端的 envelope 响应
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("创建项目失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      if (
        error.payload &&
        typeof error.payload === "object" &&
        typeof (error.payload as { message?: unknown }).message === "string"
      ) {
        return NextResponse.json(
          makeErrorResponse({
            code: error.status,
            message: (error.payload as { message: string }).message,
          }),
          { status: error.status },
        );
      }
      return NextResponse.json(
        makeErrorResponse({
          code: error.status,
          message: "创建项目失败",
        }),
        { status: error.status }
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "创建项目失败" }),
      { status: 500 }
    );
  }
}

/**
 * BFF：获取所有项目列表
 *
 * 对接后端：
 * - GET `${BACKEND_BASE_URL}/api/v1/projects`
 *
 * 说明：
 * - 获取所有项目列表
 * - 按创建时间倒序排列
 * - 统一 envelope 响应格式
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[Projects BFF] Received request:", { url: request.url });

    // 调用后端项目列表接口（auth=true：需要登录态）
    const result = await backendFetch<ApiResponse<ApiProject[]>>(
      `/api/v1/projects`
    );

    // 从 envelope 中提取 data 字段
    const projects = result.data;
    if (!projects) {
      return NextResponse.json(
        makeErrorResponse({ code: 502, message: "Bad Gateway" }),
        { status: 502 }
      );
    }

    console.log("[Projects BFF] Successfully fetched projects:", projects.length);

    // 透传后端的 envelope 响应
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("获取项目列表失败:", error);

    if (error instanceof BackendError) {
      if (isApiResponse(error.payload)) {
        return NextResponse.json(error.payload, { status: error.status });
      }
      return NextResponse.json(
        makeErrorResponse({
          code: error.status,
          message: "获取项目列表失败",
        }),
        { status: error.status }
      );
    }

    return NextResponse.json(
      makeErrorResponse({ code: 500, message: "获取项目列表失败" }),
      { status: 500 }
    );
  }
}
