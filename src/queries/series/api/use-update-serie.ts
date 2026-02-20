import { useMutation, useQueryClient } from "@tanstack/react-query";

export type UpdateSeriesInput = {
  id: string;
  name: string;
  summary?: string;
  category_ids: string[];
};

async function updateSeries(input: UpdateSeriesInput): Promise<void> {
  const response = await fetch(`/api/v1/series/${input.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      summary: input.summary,
      category_ids: input.category_ids,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to update series");
  }
}

export function useUpdateSerie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSeries,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["series", variables.id] });
    },
  });
}
