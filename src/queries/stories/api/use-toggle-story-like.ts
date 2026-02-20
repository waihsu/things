import { useMutation, useQueryClient } from "@tanstack/react-query";

type ToggleStoryLikeInput = {
  storyId: string;
};

type ToggleStoryLikeResponse = {
  liked: boolean;
  like_count: number;
};

async function toggleStoryLike(
  input: ToggleStoryLikeInput,
): Promise<ToggleStoryLikeResponse> {
  const response = await fetch(`/api/v1/stories/${input.storyId}/like`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to toggle like");
  }
  return response.json() as Promise<ToggleStoryLikeResponse>;
}

export function useToggleStoryLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleStoryLike,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stories", variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}
