import { useMutation, useQueryClient } from "@tanstack/react-query";

export type CreateStoryInput = {
  title: string;
  summary?: string;
  content: string;
  category_ids: string[];
};

async function createStory(input: CreateStoryInput): Promise<{ id: string }> {
  const response = await fetch("/api/v1/stories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to create story");
  }
  return response.json() as Promise<{ id: string }>;
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}
