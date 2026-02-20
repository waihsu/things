import { useMutation, useQueryClient } from "@tanstack/react-query";

type AddSeriesCommentInput = {
  seriesId: string;
  content: string;
};

async function addSeriesComment(
  input: AddSeriesCommentInput,
): Promise<{ id: string }> {
  const response = await fetch(`/api/v1/series/${input.seriesId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: input.content }),
  });
  if (!response.ok) {
    throw new Error("Failed to add comment");
  }
  return response.json() as Promise<{ id: string }>;
}

export function useAddSeriesComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addSeriesComment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["series-comments", variables.seriesId],
      });
      queryClient.invalidateQueries({ queryKey: ["series", variables.seriesId] });
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}
