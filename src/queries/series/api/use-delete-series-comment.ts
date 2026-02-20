import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteSeriesCommentInput = {
  seriesId: string;
  commentId: string;
};

async function deleteSeriesComment(
  input: DeleteSeriesCommentInput,
): Promise<void> {
  const response = await fetch(
    `/api/v1/series/${input.seriesId}/comments/${input.commentId}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to delete comment");
  }
}

export function useDeleteSeriesComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSeriesComment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["series-comments", variables.seriesId],
      });
      queryClient.invalidateQueries({ queryKey: ["series", variables.seriesId] });
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}
