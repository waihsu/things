import { useMutation, useQueryClient } from "@tanstack/react-query";

export type UpdatePoemInput = {
  id: string;
  title: string;
  summary?: string;
  content: string;
  category_ids: string[];
  tags: string[];
};

async function updatePoem(input: UpdatePoemInput): Promise<void> {
  const response = await fetch(`/api/v1/poems/${input.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      summary: input.summary,
      content: input.content,
      category_ids: input.category_ids,
      tags: input.tags,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to update poem");
  }
}

export function useUpdatePoem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePoem,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["poems"] });
      queryClient.invalidateQueries({ queryKey: ["poems", variables.id] });
    },
  });
}
