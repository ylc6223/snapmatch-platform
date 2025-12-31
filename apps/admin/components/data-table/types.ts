import type { SortingState, VisibilityState } from "@tanstack/react-table";

export type DataTableQueryState = {
  q: string;
  page: number;
  pageSize: number;
  sorting: SortingState;
  columnVisibility: VisibilityState;
};

export type DataTableFetchResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type DataTableFetcher<T> = (input: {
  q: string;
  page: number;
  pageSize: number;
  sortBy?: string | null;
  sortOrder?: "asc" | "desc" | null;
}) => Promise<DataTableFetchResult<T>>;

