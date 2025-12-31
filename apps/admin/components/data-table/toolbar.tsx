"use client";

import * as React from "react";
import { type Table } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export function DataTableToolbar<TData>(input: {
  table: Table<TData>;
  q: string;
  onQChange: (next: string) => void;
  onRefresh?: () => void;
  actions?: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder={input.placeholder ?? "搜索…"}
          value={input.q}
          onChange={(e) => input.onQChange(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={input.onRefresh} disabled={!input.onRefresh}>
          <RefreshCw className="h-4 w-4" />
          刷新
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">列</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {input.table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {input.actions ? <div className="flex items-center gap-2">{input.actions}</div> : null}
    </div>
  );
}

