import { useQuery } from "@tanstack/react-query";
import type { SettingsResponse } from "./types";

async function fetchSettings(): Promise<SettingsResponse> {
  const response = await fetch("/api/v1/settings");
  if (!response.ok) {
    throw new Error("Failed to fetch settings");
  }
  return response.json() as Promise<SettingsResponse>;
}

export function useGetSettings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}
