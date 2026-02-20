import { useMutation, useQueryClient } from "@tanstack/react-query";

export type DeleteEpisodeInput = {
  id: string;
  series_id: string;
};

async function deleteEpisode(input: DeleteEpisodeInput): Promise<void> {
  const response = await fetch(`/api/v1/episodes/${input.id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete episode");
  }
}

export function useDeleteEpisode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEpisode,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["episodes", variables.series_id] });
      queryClient.invalidateQueries({ queryKey: ["episodes", variables.id] });
    },
  });
}
