import type { Metadata } from "next";
import { Package } from "lucide-react";
import { headers } from "next/headers";
import { PackageTable } from "@/components/packages/package-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  PaginatedPackagesResponse,
  PackagesQueryParams,
} from "@/lib/types/package";
import { generateMeta } from "@/lib/utils";
import { withAdminBasePath } from "@/lib/routing/base-path";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "套餐管理",
    description: "管理套餐配置，支持新增、编辑、删除和搜索。",
  });
}

/**
 * 套餐管理页面（服务端组件）
 *
 * 架构说明：
 * - 本页面为服务端组件，负责初始数据获取（SSR）
 * - PackageTable 为客户端组件，负责交互逻辑（表格、Dialog等）
 * - 避免 hydration mismatch 问题
 */
export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<PackagesQueryParams>;
}) {
  // 获取查询参数
  const params = await searchParams;
  const {
    q = "",
    page = 1,
    pageSize = 20,
    sortBy = "sort",
    sortOrder = "asc",
  } = params;

  // 构建查询参数
  const queryParams = new URLSearchParams();
  if (q) queryParams.set("q", q);
  queryParams.set("page", String(page));
  queryParams.set("pageSize", String(pageSize));
  if (sortBy) queryParams.set("sortBy", sortBy);
  if (sortOrder) queryParams.set("sortOrder", sortOrder);

  // 服务端获取初始数据
  let initialData: PaginatedPackagesResponse = {
    items: [],
    total: 0,
    page: Number(page),
    pageSize: Number(pageSize),
  };

  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
    const cookie = requestHeaders.get("cookie") ?? "";
    const baseUrl = host ? `${protocol}://${host}` : "http://localhost:3000";

    const response = await fetch(
      `${baseUrl}${withAdminBasePath(`/api/packages?${queryParams.toString()}`)}`,
      {
        cache: "no-store",
        ...(cookie ? { headers: { cookie } } : {}),
      }
    );

    if (response.ok) {
      const result = await response.json();
      initialData = result.data;
    }
  } catch (error) {
    console.error("获取套餐列表失败:", error);
    // 失败时使用空数据，客户端组件会重新加载
  }

  return (
    <div className="space-y-6 pt-4">
      <Card className="border-border/60 bg-gradient-to-b from-primary/5 to-card shadow-xs">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Package className="size-4 text-muted-foreground" />
              <CardTitle className="text-base sm:text-lg">套餐管理</CardTitle>
              <Badge variant="outline" className="h-6">
                系统设置
              </Badge>
            </div>
            <CardDescription className="max-w-[72ch]">
              管理套餐配置，支持新增、编辑、删除和搜索。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
      <Separator />

      {/* 套餐表格（客户端组件） */}
      <PackageTable initialData={initialData} />
    </div>
  );
}
