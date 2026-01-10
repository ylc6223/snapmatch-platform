"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PackageFormDialog } from "@/components/packages/package-form-dialog";
import {
  useDataTableQueryState,
} from "@/components/data-table/use-data-table-query-state";
import { DataTable } from "@/components/data-table/table";
import { DataTableToolbar } from "@/components/data-table/toolbar";
import { DataTablePagination } from "@/components/data-table/pagination";
import { type ApiResponse } from "@/lib/api/response";
import { apiFetch, getApiErrorMessage } from "@/lib/api/client";
import { withAdminBasePath } from "@/lib/routing/base-path";
import type {
  Package,
  PaginatedPackagesResponse,
} from "@/lib/types/package";

interface PackageTableProps {
  initialData: PaginatedPackagesResponse;
}

/**
 * 套餐列表数据获取器（内部函数）
 */
const fetchPackages = async ({
  q,
  page,
  pageSize,
  sortBy,
  sortOrder,
}: {
  q?: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<PaginatedPackagesResponse> => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (sortBy) params.set("sortBy", sortBy);
  if (sortOrder) params.set("sortOrder", sortOrder);

  const url = withAdminBasePath(`/api/packages?${params.toString()}`);
  const payload = await apiFetch<ApiResponse<PaginatedPackagesResponse>>(url);
  return (
    payload.data ?? {
      items: [],
      total: 0,
      page,
      pageSize,
    }
  );
};

/**
 * 格式化价格显示（分 -> 元）
 */
const formatPrice = (priceInCents: number | null | undefined): string => {
  if (priceInCents === null || priceInCents === undefined) {
    return "-";
  }
  return `¥${(priceInCents / 100).toFixed(2)}`;
};

/**
 * 套餐表格组件（客户端组件）
 *
 * 负责：
 * - 表格数据展示
 * - 排序、分页、搜索
 * - 新增/编辑/删除操作
 * - 启用/禁用切换
 * - Dialog 状态管理
 */
export function PackageTable({
  initialData,
}: PackageTableProps) {
  const [queryState, queryActions] = useDataTableQueryState({
    defaultPageSize: 20,
    defaultSort: [{ id: "sort", desc: false }],
  });

  const onSortingChange: OnChangeFn<SortingState> = React.useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(queryState.sorting) : updater;
      queryActions.setSorting(next);
    },
    [queryActions, queryState.sorting],
  );

  const onColumnVisibilityChange: OnChangeFn<VisibilityState> = React.useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(queryState.columnVisibility) : updater;
      queryActions.setColumnVisibility(next);
    },
    [queryActions, queryState.columnVisibility],
  );

  const [data, setData] = React.useState<PaginatedPackagesResponse>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Dialog 状态
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingPackage, setEditingPackage] = React.useState<Package | null>(null);
  const [deleteConfirmPackage, setDeleteConfirmPackage] = React.useState<Package | null>(null);

  /**
   * 表格列定义
   */
  const columns: ColumnDef<Package>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "套餐名称",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "includedRetouchCount",
        header: "精修/入册",
        cell: ({ row }) => {
          const retouch = row.getValue("includedRetouchCount") as number;
          const album = row.getValue("includedAlbumCount") as number;
          return (
            <div className="text-muted-foreground">
              {retouch} / {album} 张
            </div>
          );
        },
      },
      {
        accessorKey: "price",
        header: "套餐价格",
        cell: ({ row }) => {
          const price = row.getValue("price") as number | null | undefined;
          return (
            <div className="text-muted-foreground">
              {formatPrice(price)}
            </div>
          );
        },
      },
      {
        accessorKey: "extraPrices",
        header: "超额单价",
        cell: ({ row }) => {
          const extraRetouch = row.original.extraRetouchPrice;
          const extraAlbum = row.original.extraAlbumPrice;
          return (
            <div className="text-sm text-muted-foreground">
              <div>精修: {formatPrice(extraRetouch)}</div>
              <div>入册: {formatPrice(extraAlbum)}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "includeAllOriginals",
        header: "底片全送",
        cell: ({ row }) => {
          const includeAll = row.getValue("includeAllOriginals") as boolean;
          return (
            <Badge variant={includeAll ? "default" : "secondary"}>
              {includeAll ? "是" : "否"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "状态",
        cell: ({ row }) => {
          const pkg = row.original;
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={pkg.isActive}
                onCheckedChange={(checked) => handleToggleActive(pkg, checked)}
                disabled={isLoading}
              />
              <span className="text-sm text-muted-foreground">
                {pkg.isActive ? "启用" : "禁用"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "sort",
        header: "排序",
        cell: ({ row }) => {
          const sort = row.getValue("sort") as number;
          return (
            <div className="text-muted-foreground">{sort}</div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const pkg = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <IconDotsVertical className="h-4 w-4" />
                  <span className="sr-only">打开菜单</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleEdit(pkg)}
                  className="cursor-pointer"
                >
                  <IconEdit className="mr-2 h-4 w-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(pkg)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <IconTrash className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [isLoading]
  );

  /**
   * 加载数据
   */
  const loadData = React.useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const result = await fetchPackages({
          q: queryState.q,
          page: queryState.page,
          pageSize: queryState.pageSize,
          sortBy: queryState.sorting[0]?.id,
          sortOrder: queryState.sorting[0]?.desc ? "desc" : "asc",
        });

        setData(result);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "获取套餐列表失败"));
        console.error("获取套餐列表失败:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [queryState]
  );

  // 当查询状态变化时重新加载数据
  React.useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * 处理编辑
   */
  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsFormDialogOpen(true);
  };

  /**
   * 处理删除
   */
  const handleDelete = (pkg: Package) => {
    setDeleteConfirmPackage(pkg);
  };

  /**
   * 确认删除
   */
  const confirmDelete = async () => {
    if (!deleteConfirmPackage) return;

    try {
      await apiFetch(withAdminBasePath(`/api/packages/${deleteConfirmPackage.id}`), {
        method: "DELETE",
      });

      toast.success("套餐删除成功");
      setDeleteConfirmPackage(null);
      loadData(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "删除失败"));
      console.error("删除套餐失败:", error);
    }
  };

  /**
   * 处理新建套餐
   */
  const handleCreate = () => {
    setEditingPackage(null);
    setIsFormDialogOpen(true);
  };

  /**
   * 切换启用状态
   */
  const handleToggleActive = async (pkg: Package, checked: boolean) => {
    try {
      await apiFetch(withAdminBasePath(`/api/packages/${pkg.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: checked }),
      });

      toast.success(checked ? "套餐已启用" : "套餐已禁用");
      loadData(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "操作失败"));
      console.error("切换套餐状态失败:", error);
    }
  };

  /**
   * 表单提交成功后的回调
   */
  const handleFormSuccess = () => {
    loadData(true);
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={data.items}
        isLoading={isLoading}
        sorting={queryState.sorting}
        onSortingChange={onSortingChange}
        columnVisibility={queryState.columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
        renderToolbar={(table) => (
          <DataTableToolbar
            table={table}
            q={queryState.q}
            onQChange={queryActions.setQ}
            onRefresh={() => loadData(true)}
            actions={<Button onClick={handleCreate}>新建套餐</Button>}
            placeholder="搜索套餐名称..."
          />
        )}
      />

      <DataTablePagination
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        isFetching={isLoading || isRefreshing}
        onPageChange={queryActions.setPage}
        onPageSizeChange={queryActions.setPageSize}
      />

      {/* 套餐表单 Dialog */}
      <PackageFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSuccess={handleFormSuccess}
        package={editingPackage}
      />

      {/* 删除确认 Dialog */}
      {deleteConfirmPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-background border rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">确认删除</h3>
            <p className="text-muted-foreground mb-4">
              确定要删除套餐
              <span className="font-medium text-foreground">
                {" "}
                {deleteConfirmPackage.name}
              </span>
              吗？此操作无法撤销。
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmPackage(null)}
              >
                取消
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
