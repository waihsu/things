import { useMutation, useQueryClient } from "@tanstack/react-query";

export type CreateEpisodeInput = {
  series_id: string;
  name: string;
  paragraph: string;
  order?: number;
};

async function createEpisode(input: CreateEpisodeInput): Promise<{ id: string }> {
  const response = await fetch("/api/v1/episodes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to create episode");
  }
  return response.json() as Promise<{ id: string }>;
}

export function useCreateEpisode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEpisode,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["episodes", variables.series_id] });
      queryClient.invalidateQueries({ queryKey: ["series", variables.series_id] });
    },
  });
}
