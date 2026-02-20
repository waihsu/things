import { useMutation, useQueryClient } from "@tanstack/react-query";

type BanPoemInput = {
  id: string;
  banned: boolean;
  reason?: string;
};

async function updatePoemBanStatus(input: BanPoemInput): Promise<void> {
  const path = input.banned ? "ban" : "unban";
  const response = await fetch(`/api/v1/poems/${input.id}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: input.reason ?? null }),
  });

  if (!response.ok) {
    throw new Error(`Failed to ${input.banned ? "ban" : "unban"} poem`);
  }
}

export function useBanPoem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePoemBanStatus,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["poems"] });
      queryClient.invalidateQueries({ queryKey: ["poems", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
