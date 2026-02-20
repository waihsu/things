import { useMutation, useQueryClient } from "@tanstack/react-query";

type BanStoryInput = {
  id: string;
  banned: boolean;
  reason?: string;
};

async function updateStoryBanStatus(input: BanStoryInput): Promise<void> {
  const path = input.banned ? "ban" : "unban";
  const response = await fetch(`/api/v1/stories/${input.id}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: input.reason ?? null }),
  });

  if (!response.ok) {
    throw new Error(`Failed to ${input.banned ? "ban" : "unban"} story`);
  }
}

export function useBanStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStoryBanStatus,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["stories", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
