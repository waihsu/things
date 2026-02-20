import { useMutation, useQueryClient } from "@tanstack/react-query";

async function deleteSeries(id: string): Promise<void> {
  const response = await fetch(`/api/v1/series/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete series");
  }
}

export function useDeleteSerie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSeries,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["series", id] });
    },
  });
}
