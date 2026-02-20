import { useMutation, useQueryClient } from "@tanstack/react-query";

export type IncrementPoemReadInput = {
  poemId: string;
};

type IncrementPoemReadResponse = {
  read_count: number;
};

async function incrementPoemRead(
  input: IncrementPoemReadInput,
): Promise<IncrementPoemReadResponse> {
  const response = await fetch(`/api/v1/poems/${input.poemId}/read`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to increment poem read count");
  }

  return response.json() as Promise<IncrementPoemReadResponse>;
}

export function useIncrementPoemRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: incrementPoemRead,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["poems", variables.poemId] });
      queryClient.invalidateQueries({ queryKey: ["poems"] });
    },
  });
}
