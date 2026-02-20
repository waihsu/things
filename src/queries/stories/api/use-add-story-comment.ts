import { useMutation, useQueryClient } from "@tanstack/react-query";

type AddStoryCommentInput = {
  storyId: string;
  content: string;
};

async function addStoryComment(input: AddStoryCommentInput): Promise<{ id: string }> {
  const response = await fetch(`/api/v1/stories/${input.storyId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: input.content }),
  });
  if (!response.ok) {
    throw new Error("Failed to add comment");
  }
  return response.json() as Promise<{ id: string }>;
}

export function useAddStoryComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addStoryComment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["story-comments", variables.storyId],
      });
      queryClient.invalidateQueries({ queryKey: ["stories", variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}
