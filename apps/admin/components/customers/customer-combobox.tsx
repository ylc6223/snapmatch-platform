"use client";

import * as React from "react";
import { Check, ChevronDown, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ApiResponse } from "@/lib/api/response";
import { cn } from "@/lib/utils";

export type CustomerComboboxItem = {
  id: string;
  name: string;
  phone: string;
};

type CustomerListData =
  | CustomerComboboxItem[]
  | {
      items: CustomerComboboxItem[];
      total: number;
      page: number;
      pageSize: number;
    };

function pickCustomerItems(data: CustomerListData | undefined) {
  if (!data) return [];
  return Array.isArray(data) ? data : data.items;
}

export function CustomerCombobox({
  value,
  onChange,
  disabled,
}: {
  value: CustomerComboboxItem | null;
  onChange: (next: CustomerComboboxItem | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [items, setItems] = React.useState<CustomerComboboxItem[]>([]);

  React.useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({ page: "1", pageSize: "20" });
        const q = search.trim();
        if (q) params.set("q", q);

        const response = await fetch(`/admin/api/customers?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
        });

        const payload = (await response.json().catch(() => null)) as ApiResponse<CustomerListData> | null;
        if (!response.ok) {
          throw new Error(payload?.message || "获取客户列表失败");
        }

        const nextItems = pickCustomerItems(payload?.data);
        setItems(nextItems);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setItems([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, search]);

  const label = value ? `${value.name} (${value.phone})` : "选择客户";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          role="combobox"
          variant="ghost"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between bg-muted/30 border-2 rounded-xl px-4 py-3 text-base font-bold transition-all outline-none h-auto",
            "border-transparent hover:bg-muted/50",
            "data-[state=open]:bg-background data-[state=open]:border-primary/20 data-[state=open]:shadow-lg",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <span className={cn(!value && "text-muted-foreground/60")}>{label}</span>
          {disabled ? (
            <Lock className="ml-2 size-4 shrink-0 opacity-60" />
          ) : (
            <ChevronDown
              className={cn(
                "ml-2 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="输入姓名或手机号搜索…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isSearching ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="size-4 animate-spin" />
                <span className="ml-2 text-muted-foreground text-sm">搜索中...</span>
              </div>
            ) : (
              <>
                {!search.trim() ? (
                  <div className="p-3 text-xs text-muted-foreground">
                    输入姓名或手机号进行搜索；也可以直接选择最近客户（默认展示第一页）。
                  </div>
                ) : null}

                {items.length === 0 ? <CommandEmpty>未找到匹配客户</CommandEmpty> : null}

                {items.length > 0 ? (
                  <CommandGroup>
                    {items.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={`${customer.name} ${customer.phone}`}
                        onSelect={() => {
                          onChange(customer.id === value?.id ? null : customer);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            customer.id === value?.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm">{customer.name}</span>
                          <span className="text-xs text-muted-foreground">{customer.phone}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}

              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
