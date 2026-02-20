import { useMutation, useQueryClient } from "@tanstack/react-query";

type IncrementSeriesReadInput = {
  seriesId: string;
};

type IncrementSeriesReadResponse = {
  read_count: number;
};

async function incrementSeriesRead(
  input: IncrementSeriesReadInput,
): Promise<IncrementSeriesReadResponse> {
  const response = await fetch(`/api/v1/series/${input.seriesId}/read`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to increment read count");
  }
  return response.json() as Promise<IncrementSeriesReadResponse>;
}

export function useIncrementSeriesRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: incrementSeriesRead,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["series", variables.seriesId],
      });
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}
