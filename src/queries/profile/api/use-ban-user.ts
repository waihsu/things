import { useMutation, useQueryClient } from "@tanstack/react-query";

type BanUserInput = {
  id: string;
  banned: boolean;
  reason?: string;
};

async function updateUserBanStatus(input: BanUserInput): Promise<void> {
  const path = input.banned ? "ban" : "unban";
  const response = await fetch(`/api/v1/profile/admin/users/${input.id}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: input.reason ?? null }),
  });

  if (!response.ok) {
    throw new Error(`Failed to ${input.banned ? "ban" : "unban"} user`);
  }
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserBanStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["presence"] });
    },
  });
}
