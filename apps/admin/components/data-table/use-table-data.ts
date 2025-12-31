"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { DataTableFetcher, DataTableFetchResult, DataTableQueryState } from "./types";

export function useTableData<T>(input: {
  queryKey: readonly unknown[];
  state: DataTableQueryState;
  fetcher: DataTableFetcher<T>;
}): ReturnType<typeof useQuery<DataTableFetchResult<T>>> {
  const sortBy = input.state.sorting[0]?.id ?? null;
  const sortOrder = input.state.sorting[0] ? (input.state.sorting[0].desc ? "desc" : "asc") : null;

  return useQuery({
    queryKey: input.queryKey,
    queryFn: () =>
      input.fetcher({
        q: input.state.q,
        page: input.state.page,
        pageSize: input.state.pageSize,
        sortBy,
        sortOrder,
      }),
    placeholderData: keepPreviousData,
  });
}

