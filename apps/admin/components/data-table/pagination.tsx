"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DataTablePagination(input: {
  total: number;
  page: number;
  pageSize: number;
  isFetching?: boolean;
  onPageChange: (next: number) => void;
  onPageSizeChange?: (next: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil((input.total || 0) / input.pageSize));

  return (
    <div className="flex flex-col gap-2 pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
      <div>
        共 {input.total} 条 · 第 {input.page}/{totalPages} 页
      </div>
      <div className="flex items-center gap-2">
        {input.onPageSizeChange ? (
          <Select value={String(input.pageSize)} onValueChange={(v) => input.onPageSizeChange?.(Number(v))}>
            <SelectTrigger className="w-[120px]" size="sm">
              <SelectValue placeholder="每页数量" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}/页
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          disabled={Boolean(input.isFetching) || input.page <= 1}
          onClick={() => input.onPageChange(Math.max(1, input.page - 1))}
        >
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={Boolean(input.isFetching) || input.page >= totalPages}
          onClick={() => input.onPageChange(Math.min(totalPages, input.page + 1))}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}

