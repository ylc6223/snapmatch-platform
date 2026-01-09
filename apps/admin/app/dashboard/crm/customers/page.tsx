import { CustomerTable } from "@/components/customers/customer-table";
import type {
  Customer,
  PaginatedCustomersResponse,
  CustomersQueryParams,
} from "@/lib/types/customer";

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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">客户档案</h1>
          <p className="text-muted-foreground mt-2">
            管理客户信息，支持新增、编辑、删除和搜索
          </p>
        </div>
      </div>

      {/* 客户表格（客户端组件） */}
      <CustomerTable initialData={initialData} />
    </div>
  );
}
