import { useMutation, useQueryClient } from "@tanstack/react-query";

export type CreatePoemInput = {
  title: string;
  summary?: string;
  content: string;
  category_ids: string[];
  tags: string[];
};

async function createPoem(input: CreatePoemInput): Promise<{ id: string }> {
  const response = await fetch("/api/v1/poems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to create poem");
  }
  return response.json() as Promise<{ id: string }>;
}

export function useCreatePoem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPoem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poems"] });
    },
  });
}
