import type { Metadata } from "next";
import { UsersRound } from "lucide-react";
import { CustomerTable } from "@/components/customers/customer-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  PaginatedCustomersResponse,
  CustomersQueryParams,
} from "@/lib/types/customer";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "客户档案",
    description: "管理客户信息，支持新增、编辑、删除和搜索。",
  });
}

/**
 * 客户档案页面（服务端组件）
 *
 * 架构说明：
 * - 本页面为服务端组件，负责初始数据获取（SSR）
 * - ClientTable 为客户端组件，负责交互逻辑（表格、Dialog等）
 * - 避免 hydration mismatch 问题
 */
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<CustomersQueryParams>;
}) {
  // 获取查询参数
  const params = await searchParams;
  const {
    q = "",
    page = 1,
    pageSize = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  // 构建查询参数
  const queryParams = new URLSearchParams();
  if (q) queryParams.set("q", q);
  queryParams.set("page", String(page));
  queryParams.set("pageSize", String(pageSize));
  if (sortBy) queryParams.set("sortBy", sortBy);
  if (sortOrder) queryParams.set("sortOrder", sortOrder);

  // 服务端获取初始数据
  let initialData: PaginatedCustomersResponse = {
    items: [],
    total: 0,
    page: Number(page),
    pageSize: Number(pageSize),
  };

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/customers?${queryParams.toString()}`,
      {
        cache: "no-store",
      }
    );

    if (response.ok) {
      const result = await response.json();
      initialData = result.data;
    }
  } catch (error) {
    console.error("获取客户列表失败:", error);
    // 失败时使用空数据，客户端组件会重新加载
  }

  return (
    <div className="space-y-6 pt-4">
      <Card className="border-border/60 bg-gradient-to-b from-primary/5 to-card shadow-xs">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <UsersRound className="size-4 text-muted-foreground" />
              <CardTitle className="text-base sm:text-lg">客户档案</CardTitle>
              <Badge variant="outline" className="h-6">
                CRM
              </Badge>
            </div>
            <CardDescription className="max-w-[72ch]">
              管理客户信息，支持新增、编辑、删除和搜索。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
      <Separator />

      {/* 客户表格（客户端组件） */}
      <CustomerTable initialData={initialData} />
    </div>
  );
}
