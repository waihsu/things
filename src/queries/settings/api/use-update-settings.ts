import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SettingsResponse, UpdateSettingsInput } from "./types";

async function updateSettings(input: UpdateSettingsInput): Promise<SettingsResponse> {
  const response = await fetch("/api/v1/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = "Failed to update settings";
    try {
      const data = (await response.json()) as { message?: string };
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return response.json() as Promise<SettingsResponse>;
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(["settings"], data);
    },
  });
}

