import { useQuery } from "@tanstack/react-query";
import type { FollowSummary, FollowSummaryResponse } from "./types";

const fetchFollowSummary = async (targetUserId: string): Promise<FollowSummary> => {
  const response = await fetch(`/api/v1/follows/${targetUserId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch follow summary");
  }

  const data = (await response.json()) as FollowSummaryResponse;
  return data.follow;
};

export function useGetFollowSummary(targetUserId: string) {
  return useQuery({
    queryKey: ["follows", "summary", targetUserId],
    queryFn: () => fetchFollowSummary(targetUserId),
    enabled: Boolean(targetUserId),
    staleTime: 15_000,
  });
}
