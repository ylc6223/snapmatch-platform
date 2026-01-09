"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  type ColumnDef,
  type SortingState,
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
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import {
  useDataTableQueryState,
  type DataTableFetcher,
} from "@/components/data-table/use-data-table-query-state";
import { DataTable } from "@/components/data-table/table";
import { DataTableToolbar } from "@/components/data-table/toolbar";
import { DataTablePagination } from "@/components/data-table/pagination";
import type {
  Customer,
  PaginatedCustomersResponse,
} from "@/lib/types/customer";

interface CustomerTableProps {
  fetchCustomers: DataTableFetcher<Customer>;
  initialData: PaginatedCustomersResponse;
}

/**
 * 客户表格组件（客户端组件）
 *
 * 负责：
 * - 表格数据展示
 * - 排序、分页、搜索
 * - 新增/编辑/删除操作
 * - Dialog 状态管理
 */
export function CustomerTable({
  fetchCustomers,
  initialData,
}: CustomerTableProps) {
  const [queryState, queryActions] = useDataTableQueryState({
    defaultPageSize: 20,
    defaultSort: [{ id: "createdAt", desc: true }],
  });

  const [data, setData] = React.useState<PaginatedCustomersResponse>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Dialog 状态
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const [deleteConfirmCustomer, setDeleteConfirmCustomer] = React.useState<Customer | null>(null);

  /**
   * 表格列定义
   */
  const columns: ColumnDef<Customer>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "客户姓名",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "phone",
        header: "手机号",
        cell: ({ row }) => (
          <div className="text-muted-foreground">{row.getValue("phone")}</div>
        ),
      },
      {
        accessorKey: "email",
        header: "邮箱",
        cell: ({ row }) => {
          const email = row.getValue("email") as string | undefined;
          return email ? (
            <div className="text-muted-foreground">{email}</div>
          ) : (
            <span className="text-muted-foreground/50">-</span>
          );
        },
      },
      {
        accessorKey: "tags",
        header: "标签",
        cell: ({ row }) => {
          const tags = row.getValue("tags") as string[] | undefined;
          return tags && tags.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground/50">-</span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "创建时间",
        cell: ({ row }) => {
          const createdAt = row.getValue("createdAt") as number;
          const date = new Date(createdAt);
          return (
            <div className="text-muted-foreground text-sm">
              {date.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const customer = row.original;

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
                  onClick={() => handleEdit(customer)}
                  className="cursor-pointer"
                >
                  <IconEdit className="mr-2 h-4 w-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(customer)}
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
    []
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

        const result = await fetchCustomers({
          q: queryState.q,
          page: queryState.page,
          pageSize: queryState.pageSize,
          sortBy: queryState.sorting[0]?.id,
          sortOrder: queryState.sorting[0]?.desc ? "desc" : "asc",
        });

        setData(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "获取客户列表失败";
        toast.error(message);
        console.error("获取客户列表失败:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [queryState, fetchCustomers]
  );

  // 当查询状态变化时重新加载数据
  React.useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * 处理编辑
   */
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormDialogOpen(true);
  };

  /**
   * 处理删除
   */
  const handleDelete = (customer: Customer) => {
    setDeleteConfirmCustomer(customer);
  };

  /**
   * 确认删除
   */
  const confirmDelete = async () => {
    if (!deleteConfirmCustomer) return;

    try {
      const response = await fetch(
        `/api/customers/${deleteConfirmCustomer.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "删除失败");
      }

      toast.success("客户删除成功");
      setDeleteConfirmCustomer(null);
      loadData(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "删除失败";
      toast.error(message);
      console.error("删除客户失败:", error);
    }
  };

  /**
   * 处理新建客户
   */
  const handleCreate = () => {
    setEditingCustomer(null);
    setIsFormDialogOpen(true);
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
        onSortingChange={queryActions.setSorting}
        columnVisibility={queryState.columnVisibility}
        onColumnVisibilityChange={queryActions.setColumnVisibility}
        renderToolbar={(table) => (
          <DataTableToolbar
            table={table}
            q={queryState.q}
            onQChange={queryActions.setQ}
            onRefresh={() => loadData(true)}
            actions={<Button onClick={handleCreate}>新建客户</Button>}
            placeholder="搜索客户姓名或手机号..."
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

      {/* 客户表单 Dialog */}
      <CustomerFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSuccess={handleFormSuccess}
        customer={editingCustomer}
      />

      {/* 删除确认 Dialog */}
      {deleteConfirmCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-background border rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">确认删除</h3>
            <p className="text-muted-foreground mb-4">
              确定要删除客户
              <span className="font-medium text-foreground">
                {" "}
                {deleteConfirmCustomer.name}
              </span>
              吗？此操作无法撤销。
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmCustomer(null)}
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
