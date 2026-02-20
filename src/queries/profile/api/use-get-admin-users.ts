import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { AdminUser } from "./types";

type AdminUsersResponse = {
  users: AdminUser[];
  total_count: number;
  limit: number;
  offset: number;
  has_more: boolean;
  next_offset: number | null;
};

type FetchInput = {
  limit: number;
  offset?: number;
  search?: string;
  sortBy?: "recent" | "activity" | "name";
};

const fetchAdminUsers = async (input: FetchInput): Promise<AdminUsersResponse> => {
  const params = new URLSearchParams();
  params.set("limit", String(input.limit));
  params.set("offset", String(input.offset ?? 0));

  if (input.search?.trim()) {
    params.set("search", input.search.trim());
  }

  if (input.sortBy) {
    params.set("sortBy", input.sortBy);
  }

  const response = await fetch(`/api/v1/profile/admin/users?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return (await response.json()) as AdminUsersResponse;
};

export function useGetAdminUsers(options?: {
  limit?: number;
  search?: string;
  sortBy?: "recent" | "activity" | "name";
  enabled?: boolean;
}) {
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 100));
  const search = options?.search?.trim() ?? "";
  const sortBy = options?.sortBy ?? "recent";

  const query = useInfiniteQuery({
    queryKey: ["admin", "users", limit, search, sortBy],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchAdminUsers({
        limit,
        offset: pageParam,
        search,
        sortBy,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_offset ?? undefined) : undefined,
    staleTime: 20_000,
    enabled: options?.enabled ?? true,
  });

  const users = useMemo(() => {
    const merged = query.data?.pages.flatMap((page) => page.users) ?? [];
    const seen = new Set<string>();
    const deduped: AdminUser[] = [];

    for (const user of merged) {
      if (!user.id || seen.has(user.id)) {
        continue;
      }
      seen.add(user.id);
      deduped.push(user);
    }

    return deduped;
  }, [query.data]);

  const totalCount = query.data?.pages[0]?.total_count ?? users.length;

  return {
    ...query,
    users,
    totalCount,
  };
}
