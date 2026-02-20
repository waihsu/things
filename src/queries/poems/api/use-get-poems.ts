import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Poem } from "./types";

type PoemsResponse = {
  poems: Poem[];
  next_cursor: string | null;
  has_more: boolean;
  total_count: number;
  total_reads: number;
};

type FetchPoemsPageInput = {
  cursor?: string | null;
  limit: number;
  mode?: "latest" | "random";
  includeBanned?: boolean;
};

async function fetchPoemsPage(
  input: FetchPoemsPageInput,
): Promise<PoemsResponse> {
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

  const response = await fetch(`/api/v1/poems?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch poems");
  }
  return (await response.json()) as PoemsResponse;
}

export function useGetPoems(options?: {
  limit?: number;
  enabled?: boolean;
  mode?: "latest" | "random";
  includeBanned?: boolean;
}) {
  const limit = Math.max(1, Math.min(options?.limit ?? 12, 30));
  const enabled = options?.enabled ?? true;
  const mode = options?.mode ?? "latest";
  const includeBanned = options?.includeBanned ?? false;

  const query = useInfiniteQuery({
    queryKey: ["poems", "infinite", limit, mode, includeBanned],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchPoemsPage({ cursor: pageParam, limit, mode, includeBanned }),
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    staleTime: 30_000,
    enabled,
  });

  const poems = useMemo(() => {
    const merged = query.data?.pages.flatMap((page) => page.poems) ?? [];
    const seen = new Set<string>();
    const deduped: Poem[] = [];

    for (const poem of merged) {
      if (!poem.id || seen.has(poem.id)) {
        continue;
      }
      seen.add(poem.id);
      deduped.push(poem);
    }

    return deduped;
  }, [query.data]);

  const totalCount = query.data?.pages[0]?.total_count ?? poems.length;
  const totalReads =
    query.data?.pages[0]?.total_reads ??
    poems.reduce((sum, poem) => sum + (poem.read_count ?? 0), 0);

  return {
    ...query,
    poems,
    totalCount,
    totalReads,
  };
}
