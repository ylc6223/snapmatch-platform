# Admin：通用 DataTable 方案（TanStack Table + React Query + URL 状态）

本文用于规范 `apps/admin` 中“业务表格”的统一实现方式，目标是：

- 把 `@tanstack/react-table` 当作 **表格内核**（排序/列显隐/状态）
- 把 `@tanstack/react-query` 当作 **请求与缓存层**（列表查询、写入后失效刷新）
- 把“分页/搜索/排序/列显隐”等 **表格状态同步到 URL**（可分享链接、刷新不丢状态）
- 业务页面只需要关注：`columns + fetcher + rowActions`

适用：后台列表类页面（客户、订单、素材、套系、账号等）。

---

## 1. 目录结构（代码位置）

通用组件目录：

- `apps/admin/components/data-table/`
  - `table.tsx`：`DataTable`（渲染 + TanStack Table 实例）
  - `toolbar.tsx`：`DataTableToolbar`（搜索/刷新/列显隐/右侧操作区）
  - `pagination.tsx`：`DataTablePagination`（分页/页大小）
  - `use-data-table-query-state.ts`：`useDataTableQueryState`（URL 同步）
  - `use-table-data.ts`：`useTableData`（React Query 列表查询 Hook）
  - `types.ts`：通用类型

---

## 2. 后端接口约定（强制）

### 2.1 入参（Query）

通用列表接口约定：

- `page`：从 1 开始
- `pageSize`：建议 10/20/50/100
- `q`：关键字（字符串）
- `sortBy`：排序字段（字符串，必须做白名单映射）
- `sortOrder`：`asc | desc`
- （可扩展）`filters[status]=1` 等筛选参数：后续统一纳入 `useDataTableQueryState`

### 2.2 出参（Response）

固定为：

```ts
{
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

（外层 envelope 由后端统一拦截器输出：`{ code, message, data, timestamp }`）

---

## 3. URL 状态同步（useDataTableQueryState）

### 3.1 当前已支持参数

`useDataTableQueryState` 会把以下状态同步到 `searchParams`：

- `q`
- `page`
- `pageSize`
- `sortBy`
- `sortOrder`
- `cols`（列显隐 JSON）

因此同一个列表可以做到：

- 复制 URL 给同事，打开看到同样的筛选/页码/排序
- 浏览器刷新不会丢失表格状态

---

## 4. “最小业务表格”示例（推荐模板）

下面示例是你新增一个列表页时最推荐的写法：页面只关心三件事：

1. `columns`
2. `fetcher`
3. `rowActions`（通常是操作列）

> 说明：以下示例以 `/api/users` 为例；其它业务只需要替换资源名与字段。

```tsx
'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef, OnChangeFn, SortingState, VisibilityState } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { apiFetch, getApiErrorMessage } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/response';
import { withAdminBasePath } from '@/lib/routing/base-path';

import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  useDataTableQueryState,
  useTableData,
} from '@/components/data-table';
import { Button } from '@/components/ui/button';

type UserRow = { id: string; account: string; status: 0 | 1 };

export function UsersTable() {
  const queryClient = useQueryClient();
  const [state, actions] = useDataTableQueryState({ defaultPageSize: 20 });

  // 1) 读：列表查询（服务端分页/排序）
  const listQuery = useTableData<UserRow>({
    queryKey: ['users', 'list', state.q, state.page, state.pageSize, state.sorting] as const,
    state,
    fetcher: async (input) => {
      const params = new URLSearchParams();
      if (input.q.trim()) params.set('q', input.q.trim());
      params.set('page', String(input.page));
      params.set('pageSize', String(input.pageSize));
      if (input.sortBy && input.sortOrder) {
        params.set('sortBy', input.sortBy);
        params.set('sortOrder', input.sortOrder);
      }
      const payload = await apiFetch<
        ApiResponse<{ items: UserRow[]; total: number; page: number; pageSize: number }>
      >(withAdminBasePath(`/api/users?${params.toString()}`));
      return payload.data ?? { items: [], total: 0, page: input.page, pageSize: input.pageSize };
    },
  });

  const data = listQuery.data ?? {
    items: [],
    total: 0,
    page: state.page,
    pageSize: state.pageSize,
  };

  // 2) 写：删除/禁用等操作
  const disableMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(withAdminBasePath(`/api/users/${id}`), { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
    },
    onError: (err) => {
      console.error(err);
      // toast.error(getApiErrorMessage(err, "操作失败"))
    },
  });

  // 3) DataTable 需要 OnChangeFn；我们把 updater 应用到当前 state 再写回 URL
  const onSortingChange: OnChangeFn<SortingState> = React.useCallback(
    (updater) => {
      const next = typeof updater === 'function' ? updater(state.sorting) : updater;
      actions.setSorting(next);
    },
    [actions, state.sorting],
  );

  const onColumnVisibilityChange: OnChangeFn<VisibilityState> = React.useCallback(
    (updater) => {
      const next = typeof updater === 'function' ? updater(state.columnVisibility) : updater;
      actions.setColumnVisibility(next);
    },
    [actions, state.columnVisibility],
  );

  const columns = React.useMemo<ColumnDef<UserRow, unknown>[]>(() => {
    return [
      {
        accessorKey: 'account',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            账号
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => row.original.account,
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => disableMutation.mutate(row.original.id)}
          >
            禁用
          </Button>
        ),
      },
    ];
  }, [disableMutation]);

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={data.items}
        isLoading={listQuery.isPending}
        sorting={state.sorting}
        onSortingChange={onSortingChange}
        columnVisibility={state.columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
        renderToolbar={(table) => (
          <DataTableToolbar
            table={table}
            q={state.q}
            onQChange={actions.setQ}
            onRefresh={() => void listQuery.refetch()}
            actions={<Button>新增</Button>}
          />
        )}
      />
      <DataTablePagination
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        isFetching={listQuery.isFetching}
        onPageChange={actions.setPage}
        onPageSizeChange={actions.setPageSize}
      />
    </div>
  );
}
```

---

## 5. 现有落地示例（可参考）

账号管理（账号与权限）已经迁移为通用方案：

- `apps/admin/app/dashboard/settings/accounts/accounts-manager.tsx`

---

## 6. 约定建议（团队统一）

- `queryKey` 统一格式：`[resource, "list", q, page, pageSize, sorting]`
- 列显隐在 URL 中用 `cols`（JSON）存储，避免在 localStorage 产生跨页面污染
- 所有列表接口都必须支持 `page/pageSize/q`，排序必须做后端白名单映射，禁止拼接用户输入到 SQL
- 写操作成功后统一 `invalidateQueries({ queryKey: [resource, "list"] })`
