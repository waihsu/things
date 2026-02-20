import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteStoryCommentInput = {
  storyId: string;
  commentId: string;
};

async function deleteStoryComment(input: DeleteStoryCommentInput): Promise<void> {
  const response = await fetch(
    `/api/v1/stories/${input.storyId}/comments/${input.commentId}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to delete comment");
  }
}

export function useDeleteStoryComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStoryComment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["story-comments", variables.storyId],
      });
      queryClient.invalidateQueries({ queryKey: ["stories", variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}
