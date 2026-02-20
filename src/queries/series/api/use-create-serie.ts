import { useMutation, useQueryClient } from "@tanstack/react-query";

export type CreateSeriesInput = {
  name: string;
  summary?: string;
  category_ids: string[];
};

async function createSeries(input: CreateSeriesInput): Promise<{ id: string }> {
  const response = await fetch("/api/v1/series", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to create series");
  }
  return response.json() as Promise<{ id: string }>;
}

export function useCreateSerie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSeries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}
