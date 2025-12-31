"use client";

import * as React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Plus } from "lucide-react";

import { apiFetch, getApiErrorMessage } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/response";
import { withAdminBasePath } from "@/lib/routing/base-path";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RoleCode = "admin" | "photographer" | "sales" | "customer";

type UserRoleInfo = {
  code: RoleCode;
  name: string;
};

type AdminUser = {
  id: string;
  account: string;
  userType: string;
  status: 0 | 1;
  roles: RoleCode[];
  permissions: string[];
};

type ListUsersResult = {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
};

type CreateUserPayload = {
  account: string;
  password: string;
  userType: string;
  status: 0 | 1;
  roleCodes: RoleCode[];
};

type UpdateUserPayload = Partial<Omit<CreateUserPayload, "account">> & {
  password?: string;
  roleCodes?: RoleCode[];
};

function statusLabel(status: 0 | 1) {
  return status === 1 ? "启用" : "禁用";
}

function StatusBadge({ status }: { status: 0 | 1 }) {
  const cls =
    status === 1
      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200"
      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200";
  return <Badge className={cn("rounded-md", cls)}>{statusLabel(status)}</Badge>;
}

function userTypeLabel(value: string) {
  if (value === "photographer") return "摄影师/修图";
  if (value === "sales") return "销售/客服";
  if (value === "customer") return "客户";
  return value || "-";
}

function roleLabel(role: RoleCode, roles: UserRoleInfo[]) {
  return roles.find((r) => r.code === role)?.name ?? role;
}

function uniq<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function AccountsManager() {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminUser | null>(null);

  const [createForm, setCreateForm] = React.useState<CreateUserPayload>({
    account: "",
    password: "",
    userType: "sales",
    status: 1,
    roleCodes: ["sales"],
  });

  const [editForm, setEditForm] = React.useState<UpdateUserPayload>({
    userType: "sales",
    status: 1,
    roleCodes: [],
    password: "",
  });

  const rolesQuery = useQuery({
    queryKey: ["users", "roles"] as const,
    queryFn: async () => {
      const payload = await apiFetch<ApiResponse<UserRoleInfo[]>>(withAdminBasePath("/api/users/roles"));
      return payload.data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const usersQueryParams = React.useMemo(() => {
    const params = new URLSearchParams();
    const q = query.trim();
    if (q.length > 0) params.set("q", q);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    return params;
  }, [page, pageSize, query]);

  const usersQueryKey = React.useMemo(
    () =>
      ["users", "list", { q: query.trim(), page, pageSize }] as const,
    [page, pageSize, query],
  );

  const usersQuery = useQuery({
    queryKey: usersQueryKey,
    queryFn: async () => {
      const url = withAdminBasePath(`/api/users?${usersQueryParams.toString()}`);
      const payload = await apiFetch<ApiResponse<ListUsersResult>>(url);
      return (
        payload.data ?? {
          items: [],
          total: 0,
          page,
          pageSize,
        }
      );
    },
    placeholderData: keepPreviousData,
  });

  const data = usersQuery.data ?? { items: [], total: 0, page, pageSize };
  const totalPages = Math.max(1, Math.ceil((data.total || 0) / pageSize));
  const roles = rolesQuery.data ?? [];

  function openCreate() {
    setCreateForm({
      account: "",
      password: "",
      userType: "sales",
      status: 1,
      roleCodes: ["sales"],
    });
    setCreateOpen(true);
  }

  function openEdit(user: AdminUser) {
    setEditing(user);
    setEditForm({
      userType: user.userType || "sales",
      status: user.status,
      roleCodes: user.roles ?? [],
      password: "",
    });
    setEditOpen(true);
  }

  const createUserMutation = useMutation({
    mutationFn: async (payload: CreateUserPayload) =>
      apiFetch(withAdminBasePath("/api/users"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("已创建账号");
      setCreateOpen(false);
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "创建失败"));
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (input: { id: string; payload: UpdateUserPayload }) =>
      apiFetch(withAdminBasePath(`/api/users/${input.id}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input.payload),
      }),
    onSuccess: async () => {
      toast.success("已保存修改");
      setEditOpen(false);
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "保存失败"));
    },
  });

  const disableUserMutation = useMutation({
    mutationFn: async (id: string) => apiFetch(withAdminBasePath(`/api/users/${id}`), { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("已禁用账号");
      await queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "禁用失败"));
    },
  });

  function submitCreate() {
    const account = createForm.account.trim();
    const password = createForm.password.trim();
    if (!account) return toast.error("请输入账号");
    if (password.length < 6) return toast.error("密码至少 6 位");

    const payload: CreateUserPayload = {
      ...createForm,
      account,
      password,
      roleCodes: uniq(createForm.roleCodes),
    };
    createUserMutation.mutate(payload);
  }

  function submitEdit() {
    if (!editing) return;

    const payload: UpdateUserPayload = {
      userType: editForm.userType?.trim() || "sales",
      status: editForm.status ?? 1,
      roleCodes: uniq(editForm.roleCodes ?? []),
    };

    const password = (editForm.password ?? "").trim();
    if (password.length > 0) {
      if (password.length < 6) return toast.error("密码至少 6 位");
      payload.password = password;
    }

    updateUserMutation.mutate({ id: editing.id, payload });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="按账号搜索…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
          <Button
            variant="outline"
            disabled={usersQuery.isFetching}
            onClick={() => void usersQuery.refetch()}>
            刷新
          </Button>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          新增账号
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>账号</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQuery.isPending ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                      加载中…
                    </TableCell>
                  </TableRow>
                ) : data.items.length > 0 ? (
                  data.items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.account}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {user.roles.length > 0 ? (
                            user.roles.map((r) => (
                              <Badge key={r} variant="secondary" className="rounded-md">
                                {roleLabel(r, roles)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{userTypeLabel(user.userType)}</TableCell>
                      <TableCell>
                        <StatusBadge status={user.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <span className="sr-only">打开菜单</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>操作</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEdit(user)}>编辑</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => disableUserMutation.mutate(user.id)}>
                              禁用
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 text-sm text-muted-foreground">
            <div>
              共 {data.total} 条 · 第 {data.page}/{totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={usersQuery.isFetching || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={usersQuery.isFetching || page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>新增账号</DialogTitle>
            <DialogDescription>创建新的业务系统用户账号，并分配角色与类型。</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="account">账号</Label>
              <Input
                id="account"
                value={createForm.account}
                onChange={(e) => setCreateForm((s) => ({ ...s, account: e.target.value }))}
                placeholder="例如：sales_01"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">初始密码</Label>
              <Input
                id="password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))}
                placeholder="至少 6 位"
                autoComplete="new-password"
              />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>类型</Label>
                <Select
                  value={createForm.userType}
                  onValueChange={(v) => setCreateForm((s) => ({ ...s, userType: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photographer">摄影师/修图</SelectItem>
                    <SelectItem value="sales">销售/客服</SelectItem>
                    <SelectItem value="customer">客户</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>状态</Label>
                <Select
                  value={String(createForm.status)}
                  onValueChange={(v) => setCreateForm((s) => ({ ...s, status: (Number(v) as 0 | 1) ?? 1 }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">启用</SelectItem>
                    <SelectItem value="0">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>角色</Label>
              <div className="rounded-md border p-3">
                {rolesQuery.isPending ? (
                  <div className="text-sm text-muted-foreground">加载中…</div>
                ) : roles.length === 0 ? (
                  <div className="text-sm text-muted-foreground">暂无可用角色</div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {roles.map((r) => {
                      const checked = createForm.roleCodes.includes(r.code);
                      return (
                        <label key={r.code} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              setCreateForm((s) => {
                                const on = Boolean(next);
                                const roleCodes = on
                                  ? uniq([...s.roleCodes, r.code])
                                  : s.roleCodes.filter((code) => code !== r.code);
                                return { ...s, roleCodes };
                              });
                            }}
                          />
                          <span className="font-medium">{r.name}</span>
                          <span className="text-muted-foreground">({r.code})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={submitCreate} disabled={createUserMutation.isPending || usersQuery.isFetching}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open);
        if (!open) setEditing(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑账号</DialogTitle>
            <DialogDescription>修改账号类型、状态、角色，或重置密码。</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>账号</Label>
              <Input value={editing?.account ?? ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">重置密码（可选）</Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.password ?? ""}
                onChange={(e) => setEditForm((s) => ({ ...s, password: e.target.value }))}
                placeholder="留空表示不修改"
                autoComplete="new-password"
              />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>类型</Label>
                <Select
                  value={editForm.userType ?? "sales"}
                  onValueChange={(v) => setEditForm((s) => ({ ...s, userType: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photographer">摄影师/修图</SelectItem>
                    <SelectItem value="sales">销售/客服</SelectItem>
                    <SelectItem value="customer">客户</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>状态</Label>
                <Select
                  value={String(editForm.status ?? 1)}
                  onValueChange={(v) => setEditForm((s) => ({ ...s, status: (Number(v) as 0 | 1) ?? 1 }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">启用</SelectItem>
                    <SelectItem value="0">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>角色</Label>
              <div className="rounded-md border p-3">
                {rolesQuery.isPending ? (
                  <div className="text-sm text-muted-foreground">加载中…</div>
                ) : roles.length === 0 ? (
                  <div className="text-sm text-muted-foreground">暂无可用角色</div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {roles.map((r) => {
                      const checked = (editForm.roleCodes ?? []).includes(r.code);
                      return (
                        <label key={r.code} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              setEditForm((s) => {
                                const current = s.roleCodes ?? [];
                                const on = Boolean(next);
                                const roleCodes = on
                                  ? uniq([...current, r.code])
                                  : current.filter((code) => code !== r.code);
                                return { ...s, roleCodes };
                              });
                            }}
                          />
                          <span className="font-medium">{r.name}</span>
                          <span className="text-muted-foreground">({r.code})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button onClick={submitEdit} disabled={updateUserMutation.isPending || usersQuery.isFetching}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
