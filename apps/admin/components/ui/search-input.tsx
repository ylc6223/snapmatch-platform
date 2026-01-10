"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface SearchResult {
  id: string;
  name: string;
  customerName?: string;
  status: string;
  viewerUrl: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export interface SearchInputProps {
  /**
   * 搜索框占位符文本
   */
  placeholder?: string;
  /**
   * 额外的容器类名
   */
  containerClassName?: string;
  /**
   * 选中项目时的回调函数
   */
  onSelect?: (item: SearchResult) => void;
  /**
   * 搜索 API 函数
   */
  searchFn?: (query: string) => Promise<SearchResponse>;
}

/**
 * 高亮匹配的关键词
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text;
  }

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-primary/20 text-foreground font-semibold px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function SearchInput({
  placeholder = "搜索...",
  containerClassName,
  onSelect,
  searchFn,
}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // 防抖搜索函数
  const debouncedSearch = useDebouncedCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);

      try {
        // 如果提供了自定义搜索函数，使用它；否则使用默认 API
        const searchResults = searchFn
          ? await searchFn(searchQuery)
          : await defaultSearchFn(searchQuery);

        setResults(searchResults.results);
        setIsOpen(true);
      } catch (error) {
        console.error("搜索失败:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    300, // 300ms 防抖延迟（符合文档规范）
    { leading: false, trailing: true }
  );

  // 默认搜索函数
  const defaultSearchFn = async (searchQuery: string): Promise<SearchResponse> => {
    // 注意：由于admin项目配置了 basePath: "/admin"，需要加上前缀
    const response = await fetch(
      `/admin/api/projects/search?q=${encodeURIComponent(searchQuery)}&limit=10`
    );
    if (!response.ok) {
      throw new Error("搜索请求失败");
    }

    // 后端返回 envelope 格式：{ code, message, data, timestamp }
    const result = await response.json();
    return result.data as SearchResponse;
  };

  // 处理输入变化
  const handleInputChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  // 处理选中项目
  const handleSelect = useCallback((item: SearchResult) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onSelect?.(item);
  }, [onSelect]);

  // 处理键盘事件 - Esc 关闭
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("");
      setResults([]);
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("relative", containerClassName)}>
      <Command
        className={cn(
          "w-full h-auto flex-row bg-primary/5 dark:bg-primary/10 border border-border rounded-lg overflow-hidden",
          "[&_[cmdk-group-heading]]:hidden",
          "[&_[data-slot=command-input-wrapper]]:flex-1",
          "[&_[data-slot=command-input-wrapper]]:border-0",
          "[&_[data-slot=command-input-wrapper]]:h-10",
          "[&_[data-slot=command-input-wrapper]]:px-3",
          "[&_[data-slot=command-input-wrapper]]:bg-transparent"
        )}
        onKeyDown={handleKeyDown}
      >
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={handleInputChange}
          className={cn("h-10 [&_[cmdk-input]]:h-10")}
        />

        {/* 加载指示器 */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* 搜索结果列表 */}
        {isOpen && (query.length > 0 || results.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            <CommandList>
              {isLoading && query.length > 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  搜索中...
                </div>
              ) : results.length > 0 ? (
                <CommandGroup heading="搜索结果">
                  {results.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm">
                          {highlightMatch(item.name, query)}
                        </span>
                        {item.customerName && (
                          <span className="text-xs text-muted-foreground">
                            {highlightMatch(item.customerName, query)}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : query.length > 0 ? (
                <CommandEmpty>没有找到匹配的项目</CommandEmpty>
              ) : null}
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
}
