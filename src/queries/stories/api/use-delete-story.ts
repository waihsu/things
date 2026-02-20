import { useMutation, useQueryClient } from "@tanstack/react-query";

async function deleteStory(id: string): Promise<void> {
  const response = await fetch(`/api/v1/stories/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete story");
  }
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStory,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["stories", id] });
    },
  });
}
