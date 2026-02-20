import { useMutation, useQueryClient } from "@tanstack/react-query";

type IncrementStoryReadInput = {
  storyId: string;
};

type IncrementStoryReadResponse = {
  read_count: number;
};

async function incrementStoryRead(
  input: IncrementStoryReadInput,
): Promise<IncrementStoryReadResponse> {
  const response = await fetch(`/api/v1/stories/${input.storyId}/read`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to increment read count");
  }
  return response.json() as Promise<IncrementStoryReadResponse>;
}

export function useIncrementStoryRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: incrementStoryRead,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stories", variables.storyId],
      });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}
