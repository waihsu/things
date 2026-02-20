import { useMutation, useQueryClient } from "@tanstack/react-query";

type ToggleSeriesLikeInput = {
  seriesId: string;
};

type ToggleSeriesLikeResponse = {
  liked: boolean;
  like_count: number;
};

async function toggleSeriesLike(
  input: ToggleSeriesLikeInput,
): Promise<ToggleSeriesLikeResponse> {
  const response = await fetch(`/api/v1/series/${input.seriesId}/like`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to toggle like");
  }
  return response.json() as Promise<ToggleSeriesLikeResponse>;
}

export function useToggleSeriesLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleSeriesLike,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["series", variables.seriesId] });
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}
