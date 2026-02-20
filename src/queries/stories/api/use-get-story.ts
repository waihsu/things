import { useQuery } from "@tanstack/react-query";
import type { Story } from "./types";

type StoryResponse = {
  story: Story;
};

async function fetchStory(id: string): Promise<Story> {
  const response = await fetch(`/api/v1/stories/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch story");
  }
  const data = (await response.json()) as StoryResponse;
  return data.story;
}

export function useGetStory(id: string) {
  return useQuery({
    queryKey: ["stories", id],
    queryFn: () => fetchStory(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}
