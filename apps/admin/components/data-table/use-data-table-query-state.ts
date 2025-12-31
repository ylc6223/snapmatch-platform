"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SortingState, VisibilityState } from "@tanstack/react-table";

import type { DataTableQueryState } from "./types";

function toInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.floor(parsed);
}

function parseSorting(params: URLSearchParams): SortingState {
  const sortBy = params.get("sortBy");
  const sortOrder = params.get("sortOrder");
  if (!sortBy) return [];
  return [{ id: sortBy, desc: sortOrder === "desc" }];
}

function parseColumnVisibility(params: URLSearchParams): VisibilityState {
  const raw = params.get("cols");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as VisibilityState;
  } catch {
    return {};
  }
}

function toSearchParamsString(params: URLSearchParams) {
  const s = params.toString();
  return s.length > 0 ? `?${s}` : "";
}

export function useDataTableQueryState(input?: {
  defaultPageSize?: number;
  defaultSort?: SortingState;
}): [DataTableQueryState, {
  setQ: (next: string) => void;
  setPage: (next: number) => void;
  setPageSize: (next: number) => void;
  setSorting: (next: SortingState) => void;
  setColumnVisibility: (next: VisibilityState) => void;
  reset: () => void;
}] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultPageSize = input?.defaultPageSize ?? 20;
  const params = React.useMemo(() => new URLSearchParams(searchParams), [searchParams]);

  const state = React.useMemo<DataTableQueryState>(() => {
    const page = Math.max(1, toInt(params.get("page"), 1));
    const pageSize = Math.min(100, Math.max(1, toInt(params.get("pageSize"), defaultPageSize)));
    const q = (params.get("q") ?? "").trim();
    const sorting = parseSorting(params);
    const columnVisibility = parseColumnVisibility(params);
    return { q, page, pageSize, sorting, columnVisibility };
  }, [defaultPageSize, params]);

  const replace = React.useCallback((nextParams: URLSearchParams) => {
    router.replace(`${pathname}${toSearchParamsString(nextParams)}`);
  }, [pathname, router]);

  const setQ = React.useCallback((next: string) => {
    const nextParams = new URLSearchParams(params);
    const trimmed = next.trim();
    if (trimmed.length > 0) nextParams.set("q", trimmed);
    else nextParams.delete("q");
    nextParams.set("page", "1");
    replace(nextParams);
  }, [params, replace]);

  const setPage = React.useCallback((next: number) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set("page", String(Math.max(1, Math.floor(next))));
    replace(nextParams);
  }, [params, replace]);

  const setPageSize = React.useCallback((next: number) => {
    const nextParams = new URLSearchParams(params);
    const normalized = Math.min(100, Math.max(1, Math.floor(next)));
    nextParams.set("pageSize", String(normalized));
    nextParams.set("page", "1");
    replace(nextParams);
  }, [params, replace]);

  const setSorting = React.useCallback((next: SortingState) => {
    const nextParams = new URLSearchParams(params);
    const first = next[0] ?? input?.defaultSort?.[0] ?? null;
    if (!first) {
      nextParams.delete("sortBy");
      nextParams.delete("sortOrder");
      replace(nextParams);
      return;
    }
    nextParams.set("sortBy", first.id);
    nextParams.set("sortOrder", first.desc ? "desc" : "asc");
    nextParams.set("page", "1");
    replace(nextParams);
  }, [input?.defaultSort, params, replace]);

  const setColumnVisibility = React.useCallback((next: VisibilityState) => {
    const nextParams = new URLSearchParams(params);
    const raw = JSON.stringify(next);
    if (raw === "{}") nextParams.delete("cols");
    else nextParams.set("cols", raw);
    replace(nextParams);
  }, [params, replace]);

  const reset = React.useCallback(() => {
    const nextParams = new URLSearchParams(params);
    nextParams.delete("q");
    nextParams.delete("page");
    nextParams.delete("pageSize");
    nextParams.delete("sortBy");
    nextParams.delete("sortOrder");
    nextParams.delete("cols");
    replace(nextParams);
  }, [params, replace]);

  return [
    state,
    { setQ, setPage, setPageSize, setSorting, setColumnVisibility, reset },
  ];
}

