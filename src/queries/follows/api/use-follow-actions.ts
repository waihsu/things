import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FollowSummary, FollowSummaryResponse } from "./types";

const readErrorMessage = async (response: Response, fallback: string) => {
  let message = fallback;
  try {
    const data = (await response.json()) as { message?: string };
    if (data?.message) {
      message = data.message;
    }
  } catch {
    // ignore malformed JSON
  }
  return message;
};

const postFollow = async (targetUserId: string): Promise<FollowSummary> => {
  const response = await fetch(`/api/v1/follows/${targetUserId}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to follow user"));
  }

  const data = (await response.json()) as FollowSummaryResponse;
  return data.follow;
};

const deleteFollow = async (targetUserId: string): Promise<FollowSummary> => {
  const response = await fetch(`/api/v1/follows/${targetUserId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to unfollow user"));
  }

  const data = (await response.json()) as FollowSummaryResponse;
  return data.follow;
};

export function useFollowActions(targetUserId: string) {
  const queryClient = useQueryClient();
  const summaryKey = ["follows", "summary", targetUserId];

  const syncSummary = (summary: FollowSummary) => {
    queryClient.setQueryData(summaryKey, summary);
    queryClient.invalidateQueries({ queryKey: ["profile", "public"] });
  };

  const follow = useMutation({
    mutationFn: () => postFollow(targetUserId),
    onSuccess: syncSummary,
  });

  const unfollow = useMutation({
    mutationFn: () => deleteFollow(targetUserId),
    onSuccess: syncSummary,
  });

  return {
    follow,
    unfollow,
  };
}
