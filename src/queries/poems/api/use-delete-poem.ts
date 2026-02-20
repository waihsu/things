import { useMutation, useQueryClient } from "@tanstack/react-query";

async function deletePoem(id: string): Promise<void> {
  const response = await fetch(`/api/v1/poems/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete poem");
  }
}

export function useDeletePoem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePoem,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["poems"] });
      queryClient.invalidateQueries({ queryKey: ["poems", id] });
    },
  });
}
