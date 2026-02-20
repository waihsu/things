import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Story } from "./types";

type StoriesResponse = {
  stories: Story[];
  next_cursor: string | null;
  has_more: boolean;
  total_count: number;
};

type FetchStoriesPageInput = {
  cursor?: string | null;
  limit: number;
  mode?: "latest" | "random";
  includeBanned?: boolean;
};

async function fetchStoriesPage(input: FetchStoriesPageInput): Promise<StoriesResponse> {
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

  const response = await fetch(`/api/v1/stories?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch stories");
  }
  return (await response.json()) as StoriesResponse;
}

export function useGetStories(options?: {
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
    queryKey: ["stories", "infinite", limit, mode, includeBanned],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchStoriesPage({ cursor: pageParam, limit, mode, includeBanned }),
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    staleTime: 30_000,
    enabled,
  });

  const stories = useMemo(() => {
    const merged = query.data?.pages.flatMap((page) => page.stories) ?? [];
    const seen = new Set<string>();
    const deduped: Story[] = [];

    for (const story of merged) {
      if (!story.id || seen.has(story.id)) {
        continue;
      }
      seen.add(story.id);
      deduped.push(story);
    }

    return deduped;
  }, [query.data]);

  const totalCount = query.data?.pages[0]?.total_count ?? stories.length;

  return {
    ...query,
    stories,
    totalCount,
  };
}
