import { useMutation, useQueryClient } from "@tanstack/react-query";

export type UpdateEpisodeInput = {
  id: string;
  series_id: string;
  name: string;
  paragraph: string;
  order?: number;
};

async function updateEpisode(input: UpdateEpisodeInput): Promise<void> {
  const response = await fetch(`/api/v1/episodes/${input.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      paragraph: input.paragraph,
      order: input.order,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to update episode");
  }
}

export function useUpdateEpisode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEpisode,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["episodes", variables.series_id] });
      queryClient.invalidateQueries({ queryKey: ["episodes", variables.id] });
    },
  });
}
