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
