import { useMutation, useQueryClient } from "@tanstack/react-query";

type BanSeriesInput = {
  id: string;
  banned: boolean;
  reason?: string;
};

async function updateSeriesBanStatus(input: BanSeriesInput): Promise<void> {
  const path = input.banned ? "ban" : "unban";
  const response = await fetch(`/api/v1/series/${input.id}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: input.reason ?? null }),
  });

  if (!response.ok) {
    throw new Error(`Failed to ${input.banned ? "ban" : "unban"} series`);
  }
}

export function useBanSerie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSeriesBanStatus,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["series", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
