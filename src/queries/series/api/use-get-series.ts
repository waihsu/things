import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Series } from "./types";

type SeriesResponse = {
  series: Series[];
  next_cursor: string | null;
  has_more: boolean;
  total_count: number;
};

type FetchSeriesPageInput = {
  cursor?: string | null;
  limit: number;
  mode?: "latest" | "random";
  includeBanned?: boolean;
};

async function fetchSeriesPage(input: FetchSeriesPageInput): Promise<SeriesResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(input.limit));
  if (input.cursor) {
    params.set("cursor", input.cursor);
  }
  if (input.mode && input.mode !== "latest") {
    params.set("mode", input.mode);
  }
  if (input.includeBanned) {
    params.set("include_banned", "1");
  }

  const response = await fetch(`/api/v1/series?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch series");
  }
  return (await response.json()) as SeriesResponse;
}

export function useGetSeries(options?: {
  limit?: number;
  enabled?: boolean;
  mode?: "latest" | "random";
  includeBanned?: boolean;
}) {
  const limit = Math.max(1, Math.min(options?.limit ?? 9, 30));
  const enabled = options?.enabled ?? true;
  const mode = options?.mode ?? "latest";
  const includeBanned = options?.includeBanned ?? false;

  const query = useInfiniteQuery({
    queryKey: ["series", "infinite", limit, mode, includeBanned],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchSeriesPage({ cursor: pageParam, limit, mode, includeBanned }),
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    staleTime: 30_000,
    enabled,
  });

  const series = useMemo(() => {
    const merged = query.data?.pages.flatMap((page) => page.series) ?? [];
    const seen = new Set<string>();
    const deduped: Series[] = [];

    for (const item of merged) {
      if (!item.id || seen.has(item.id)) {
        continue;
      }
      seen.add(item.id);
      deduped.push(item);
    }

    return deduped;
  }, [query.data]);

  const totalCount = query.data?.pages[0]?.total_count ?? series.length;

  return {
    ...query,
    series,
    totalCount,
  };
}
