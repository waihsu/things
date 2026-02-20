import { useMutation, useQueryClient } from "@tanstack/react-query";

export type UpdateStoryInput = {
  id: string;
  title: string;
  summary?: string;
  content: string;
  category_ids: string[];
};

async function updateStory(input: UpdateStoryInput): Promise<void> {
  const response = await fetch(`/api/v1/stories/${input.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      summary: input.summary,
      content: input.content,
      category_ids: input.category_ids,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to update story");
  }
}

export function useUpdateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStory,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["stories", variables.id] });
    },
  });
}
