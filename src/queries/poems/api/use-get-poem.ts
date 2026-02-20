import { useQuery } from "@tanstack/react-query";
import type { Poem } from "./types";

type PoemResponse = {
  poem: Poem;
};

async function fetchPoem(id: string): Promise<Poem> {
  const response = await fetch(`/api/v1/poems/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch poem");
  }
  const data = (await response.json()) as PoemResponse;
  return data.poem;
}

export function useGetPoem(id: string) {
  return useQuery({
    queryKey: ["poems", id],
    queryFn: () => fetchPoem(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}
